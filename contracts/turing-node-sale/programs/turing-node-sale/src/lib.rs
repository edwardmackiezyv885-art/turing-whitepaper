use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, CreateAccount, Transfer};
use anchor_spl::associated_token::{
    self, get_associated_token_address_with_program_id, AssociatedToken,
};
use anchor_spl::token_2022::{self, InitializeMint2, MintTo, SetAuthority, Token2022};
use anchor_spl::token_2022_extensions::spl_pod::optional_keys::OptionalNonZeroPubkey;
use anchor_spl::token_2022_extensions::spl_token_metadata_interface::state::TokenMetadata;
use anchor_spl::token_2022_extensions::{
    metadata_pointer_initialize, non_transferable_mint_initialize, token_metadata_initialize,
    MetadataPointerInitialize, NonTransferableMintInitialize, TokenMetadataInitialize,
};
use anchor_spl::token_interface::spl_token_2022::{
    extension::ExtensionType, instruction::AuthorityType, state::Mint as SplMint,
};
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

declare_id!("46z8HyP9StJs6SvPJGC2HgsUoFuH2snsSiWypWVzxdNF");

pub const SALE_SEED: &[u8] = b"sale";
pub const PURCHASE_SEED: &[u8] = b"purchase";
pub const CERTIFICATE_SEED: &[u8] = b"certificate";
pub const REFERRAL_REWARD_SEED: &[u8] = b"referral_reward";
pub const SMOKE_TEST_TIER: u8 = 255;
pub const SMOKE_TEST_PRICE_CENTS: u64 = 100;
pub const SMOKE_TEST_CAP: u16 = 1;
pub const TREASURY: Pubkey = pubkey!("FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8");
pub const SOL_USD_FEED_ID: [u8; 32] = [
    0xef, 0x0d, 0x8b, 0x6f, 0xda, 0x2c, 0xeb, 0xa4, 0x1d, 0xa1, 0x5d, 0x40, 0x95, 0xd1, 0xda, 0x39,
    0x2a, 0x0d, 0x2f, 0x8e, 0xd0, 0xc6, 0xc7, 0xbc, 0x0f, 0x4c, 0xfa, 0xc8, 0xc2, 0x80, 0xb5, 0x6d,
];
pub const PUBLIC_PRICES_CENTS: [u64; 4] = [100_000, 500_000, 1_000_000, 5_000_000];
pub const PUBLIC_CAPS: [u16; 4] = [350, 40, 20, 5];
// The sponsored SOL/USD push account has a one-minute heartbeat. A 90-second
// ceiling keeps the quote current while avoiding failures exactly at a normal
// heartbeat boundary.
pub const DEFAULT_MAX_PRICE_AGE_SECONDS: u64 = 90;
pub const DEFAULT_MAX_CONFIDENCE_BPS: u16 = 100;
pub const LAMPORTS_PER_SOL_U128: u128 = 1_000_000_000;

#[program]
pub mod turing_node_sale {
    use super::*;

    /// Creates the singleton sale state. Public tiers always start disabled.
    /// If a smoke-test buyer is supplied, only that wallet may buy the one 1 U test certificate.
    pub fn initialize_sale(ctx: Context<InitializeSale>, smoke_test_buyer: Pubkey) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        sale.authority = ctx.accounts.authority.key();
        sale.pending_authority = Pubkey::default();
        sale.treasury = TREASURY;
        sale.sol_usd_feed_id = SOL_USD_FEED_ID;
        sale.max_price_age_seconds = DEFAULT_MAX_PRICE_AGE_SECONDS;
        sale.max_confidence_bps = DEFAULT_MAX_CONFIDENCE_BPS;
        sale.emergency_paused = false;
        sale.public_sale_enabled = false;
        sale.smoke_test_enabled = smoke_test_buyer != Pubkey::default();
        sale.smoke_test_retired = false;
        sale.smoke_test_buyer = smoke_test_buyer;
        sale.smoke_test_sold = 0;
        sale.public_prices_cents = PUBLIC_PRICES_CENTS;
        sale.public_caps = PUBLIC_CAPS;
        sale.public_sold = [0; 4];
        sale.bump = ctx.bumps.sale;
        sale.reserved = [0; 64];

        emit!(SaleInitialized {
            authority: sale.authority,
            treasury: sale.treasury,
            smoke_test_buyer,
            public_sale_enabled: false,
        });
        Ok(())
    }

    pub fn update_sale_status(
        ctx: Context<AuthorityOnly>,
        emergency_paused: bool,
        public_sale_enabled: bool,
        smoke_test_enabled: bool,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        require!(
            !smoke_test_enabled || !sale.smoke_test_retired,
            SaleError::SmokeTestRetired
        );
        require!(
            !smoke_test_enabled || sale.smoke_test_buyer != Pubkey::default(),
            SaleError::SmokeTestBuyerMissing
        );
        require!(
            !public_sale_enabled || sale.smoke_test_retired,
            SaleError::SmokeTestRequired
        );

        sale.emergency_paused = emergency_paused;
        sale.public_sale_enabled = public_sale_enabled;
        sale.smoke_test_enabled = smoke_test_enabled;

        emit!(SaleStatusUpdated {
            emergency_paused,
            public_sale_enabled,
            smoke_test_enabled,
        });
        Ok(())
    }

    pub fn set_smoke_test_buyer(
        ctx: Context<AuthorityOnly>,
        smoke_test_buyer: Pubkey,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        require!(!sale.smoke_test_retired, SaleError::SmokeTestRetired);
        require!(sale.smoke_test_sold == 0, SaleError::SmokeTestAlreadySold);
        require!(
            smoke_test_buyer != Pubkey::default(),
            SaleError::SmokeTestBuyerMissing
        );
        sale.smoke_test_buyer = smoke_test_buyer;
        emit!(SmokeTestBuyerUpdated { smoke_test_buyer });
        Ok(())
    }

    /// Permanently disables the 1 U smoke-test path after the Mainnet test succeeds.
    pub fn retire_smoke_test(ctx: Context<AuthorityOnly>) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        require!(
            sale.smoke_test_sold == SMOKE_TEST_CAP,
            SaleError::SmokeTestRequired
        );
        sale.smoke_test_enabled = false;
        sale.smoke_test_retired = true;
        emit!(SmokeTestRetired {
            sold: sale.smoke_test_sold,
        });
        Ok(())
    }

    pub fn update_oracle_limits(
        ctx: Context<AuthorityOnly>,
        max_price_age_seconds: u64,
        max_confidence_bps: u16,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        require!(
            (10..=300).contains(&max_price_age_seconds),
            SaleError::InvalidOracleLimits
        );
        require!(
            (1..=500).contains(&max_confidence_bps),
            SaleError::InvalidOracleLimits
        );
        sale.max_price_age_seconds = max_price_age_seconds;
        sale.max_confidence_bps = max_confidence_bps;
        emit!(OracleLimitsUpdated {
            max_price_age_seconds,
            max_confidence_bps,
        });
        Ok(())
    }

    pub fn propose_authority(ctx: Context<AuthorityOnly>, pending_authority: Pubkey) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        require!(
            pending_authority != Pubkey::default(),
            SaleError::InvalidAuthority
        );
        sale.pending_authority = pending_authority;
        emit!(AuthorityProposed {
            current_authority: sale.authority,
            pending_authority,
        });
        Ok(())
    }

    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.pending_authority.key(),
            sale.pending_authority,
            SaleError::Unauthorized
        );
        let previous_authority = sale.authority;
        sale.authority = ctx.accounts.pending_authority.key();
        sale.pending_authority = Pubkey::default();
        emit!(AuthorityAccepted {
            previous_authority,
            new_authority: sale.authority,
        });
        Ok(())
    }

    /// Atomically verifies the Pyth price, collects SOL, records attribution,
    /// decrements inventory, and mints a wallet-bound Token-2022 certificate.
    pub fn purchase_node(
        ctx: Context<PurchaseNode>,
        tier: u8,
        max_lamports: u64,
        client_order_id: [u8; 16],
        referrer: Pubkey,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        require!(!sale.emergency_paused, SaleError::SalePaused);
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            sale.treasury,
            SaleError::InvalidTreasury
        );
        require!(
            referrer == Pubkey::default() || referrer != ctx.accounts.buyer.key(),
            SaleError::SelfReferral
        );

        let is_smoke_test = tier == SMOKE_TEST_TIER;
        let usd_price_cents = if is_smoke_test {
            require!(sale.smoke_test_enabled, SaleError::SmokeTestDisabled);
            require!(!sale.smoke_test_retired, SaleError::SmokeTestRetired);
            require_keys_eq!(
                ctx.accounts.buyer.key(),
                sale.smoke_test_buyer,
                SaleError::SmokeTestBuyerOnly
            );
            require!(
                sale.smoke_test_sold < SMOKE_TEST_CAP,
                SaleError::TierSoldOut
            );
            require!(
                referrer == Pubkey::default(),
                SaleError::SmokeTestHasNoReferral
            );
            SMOKE_TEST_PRICE_CENTS
        } else {
            require!(sale.public_sale_enabled, SaleError::PublicSaleDisabled);
            let tier_index = usize::from(tier);
            require!(tier_index < sale.public_caps.len(), SaleError::InvalidTier);
            require!(
                sale.public_sold[tier_index] < sale.public_caps[tier_index],
                SaleError::TierSoldOut
            );
            sale.public_prices_cents[tier_index]
        };

        let clock = Clock::get()?;
        let price = ctx
            .accounts
            .price_update
            .get_price_no_older_than(&clock, sale.max_price_age_seconds, &sale.sol_usd_feed_id)
            .map_err(|_| error!(SaleError::InvalidOraclePrice))?;
        require!(price.price > 0, SaleError::InvalidOraclePrice);
        require!(
            confidence_within_limit(price.price, price.conf, sale.max_confidence_bps)?,
            SaleError::OracleConfidenceTooWide
        );

        let paid_lamports = usd_cents_to_lamports(usd_price_cents, price.price, price.exponent)?;
        require!(paid_lamports <= max_lamports, SaleError::SlippageExceeded);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            paid_lamports,
        )?;

        if is_smoke_test {
            sale.smoke_test_sold = sale
                .smoke_test_sold
                .checked_add(1)
                .ok_or(SaleError::MathOverflow)?;
        } else {
            let tier_index = usize::from(tier);
            sale.public_sold[tier_index] = sale.public_sold[tier_index]
                .checked_add(1)
                .ok_or(SaleError::MathOverflow)?;
        }

        let purchase_key = ctx.accounts.purchase_record.key();
        let certificate_bump = ctx.bumps.certificate_mint;
        let mint_bump_seed = [certificate_bump];
        let mint_seeds: &[&[u8]] = &[CERTIFICATE_SEED, purchase_key.as_ref(), &mint_bump_seed];
        let sale_bump_seed = [sale.bump];
        let sale_seeds: &[&[u8]] = &[SALE_SEED, &sale_bump_seed];
        let metadata = certificate_metadata(tier)?;

        mint_wallet_bound_nft(
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.buyer.to_account_info(),
            sale.to_account_info(),
            ctx.accounts.certificate_mint.to_account_info(),
            ctx.accounts.certificate_token_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            mint_seeds,
            sale_seeds,
            metadata,
        )?;

        let purchase = &mut ctx.accounts.purchase_record;
        purchase.buyer = ctx.accounts.buyer.key();
        purchase.referrer = referrer;
        purchase.tier = tier;
        purchase.is_smoke_test = is_smoke_test;
        purchase.usd_price_cents = usd_price_cents;
        purchase.paid_lamports = paid_lamports;
        purchase.oracle_price = price.price;
        purchase.oracle_exponent = price.exponent;
        purchase.oracle_confidence = price.conf;
        purchase.oracle_publish_time = price.publish_time;
        purchase.certificate_mint = ctx.accounts.certificate_mint.key();
        purchase.client_order_id = client_order_id;
        purchase.purchased_at = clock.unix_timestamp;
        purchase.delivered = false;
        purchase.referral_reward_minted = false;
        purchase.referral_reward_mint = Pubkey::default();
        purchase.last_referral_evidence_hash = [0; 32];
        purchase.bump = ctx.bumps.purchase_record;
        purchase.reserved = [0; 31];

        emit!(NodePurchased {
            purchase_record: purchase.key(),
            buyer: purchase.buyer,
            referrer,
            tier,
            is_smoke_test,
            usd_price_cents,
            paid_lamports,
            oracle_price: price.price,
            oracle_exponent: price.exponent,
            oracle_publish_time: price.publish_time,
            certificate_mint: purchase.certificate_mint,
            client_order_id,
        });
        Ok(())
    }

    pub fn mark_delivered(ctx: Context<ManagePurchase>) -> Result<()> {
        let sale = &ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        let purchase = &mut ctx.accounts.purchase_record;
        require!(!purchase.is_smoke_test, SaleError::SmokeTestHasNoRights);
        require!(!purchase.delivered, SaleError::AlreadyDelivered);
        purchase.delivered = true;
        emit!(NodeDelivered {
            purchase_record: purchase.key(),
            buyer: purchase.buyer,
            delivered_at: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Mints the invitation reward only after delivery. Its metadata value is
    /// 10% of the referred node's purchase tier (100/500/1,000/5,000 U).
    pub fn mint_referral_reward(ctx: Context<MintReferralReward>) -> Result<()> {
        let sale = &ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        let purchase = &mut ctx.accounts.purchase_record;
        require!(!purchase.is_smoke_test, SaleError::SmokeTestHasNoReferral);
        require!(
            purchase.referrer != Pubkey::default(),
            SaleError::NoReferrer
        );
        require_keys_eq!(
            ctx.accounts.referrer.key(),
            purchase.referrer,
            SaleError::InvalidReferrer
        );
        require!(purchase.delivered, SaleError::NotDelivered);
        require!(
            !purchase.referral_reward_minted,
            SaleError::ReferralRewardAlreadyMinted
        );

        let purchase_key = purchase.key();
        let reward_bump = ctx.bumps.reward_mint;
        let reward_bump_seed = [reward_bump];
        let reward_mint_seeds: &[&[u8]] = &[
            REFERRAL_REWARD_SEED,
            purchase_key.as_ref(),
            &reward_bump_seed,
        ];
        let sale_bump_seed = [sale.bump];
        let sale_seeds: &[&[u8]] = &[SALE_SEED, &sale_bump_seed];

        mint_wallet_bound_nft(
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.referrer.to_account_info(),
            sale.to_account_info(),
            ctx.accounts.reward_mint.to_account_info(),
            ctx.accounts.reward_token_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            reward_mint_seeds,
            sale_seeds,
            referral_reward_metadata(purchase.tier)?,
        )?;

        purchase.referral_reward_minted = true;
        purchase.referral_reward_mint = ctx.accounts.reward_mint.key();
        emit!(ReferralRewardMinted {
            purchase_record: purchase.key(),
            referrer: purchase.referrer,
            tier: purchase.tier,
            reward_mint: purchase.referral_reward_mint,
        });
        Ok(())
    }

    /// Provides the auditable correction path described by the website.
    pub fn review_referral(
        ctx: Context<ManagePurchase>,
        new_referrer: Pubkey,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        let sale = &ctx.accounts.sale;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            sale.authority,
            SaleError::Unauthorized
        );
        let purchase = &mut ctx.accounts.purchase_record;
        require!(!purchase.is_smoke_test, SaleError::SmokeTestHasNoReferral);
        require!(
            !purchase.referral_reward_minted,
            SaleError::ReferralAlreadyFinalized
        );
        require!(new_referrer != purchase.buyer, SaleError::SelfReferral);
        require!(evidence_hash != [0; 32], SaleError::EvidenceHashRequired);
        let previous_referrer = purchase.referrer;
        purchase.referrer = new_referrer;
        purchase.last_referral_evidence_hash = evidence_hash;
        emit!(ReferralReviewed {
            purchase_record: purchase.key(),
            previous_referrer,
            new_referrer,
            evidence_hash,
            reviewed_at: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSale<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + SaleState::INIT_SPACE,
        seeds = [SALE_SEED],
        bump
    )]
    pub sale: Account<'info, SaleState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuthorityOnly<'info> {
    #[account(mut, seeds = [SALE_SEED], bump = sale.bump)]
    pub sale: Account<'info, SaleState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    #[account(mut, seeds = [SALE_SEED], bump = sale.bump)]
    pub sale: Account<'info, SaleState>,
    pub pending_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(tier: u8, max_lamports: u64, client_order_id: [u8; 16])]
pub struct PurchaseNode<'info> {
    #[account(mut, seeds = [SALE_SEED], bump = sale.bump)]
    pub sale: Account<'info, SaleState>,
    #[account(
        init,
        payer = buyer,
        space = 8 + PurchaseRecord::INIT_SPACE,
        seeds = [PURCHASE_SEED, buyer.key().as_ref(), client_order_id.as_ref()],
        bump
    )]
    pub purchase_record: Account<'info, PurchaseRecord>,
    #[account(
        mut,
        seeds = [CERTIFICATE_SEED, purchase_record.key().as_ref()],
        bump
    )]
    /// CHECK: PDA is created and initialized as a Token-2022 mint in the instruction.
    pub certificate_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        address = get_associated_token_address_with_program_id(
            &buyer.key(),
            &certificate_mint.key(),
            &token_2022::ID
        )
    )]
    /// CHECK: Exact Token-2022 ATA address is enforced and created in the instruction.
    pub certificate_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, address = TREASURY)]
    /// CHECK: Fixed treasury address; it only receives lamports.
    pub treasury: UncheckedAccount<'info>,
    pub price_update: Account<'info, PriceUpdateV2>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManagePurchase<'info> {
    #[account(seeds = [SALE_SEED], bump = sale.bump)]
    pub sale: Account<'info, SaleState>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub purchase_record: Account<'info, PurchaseRecord>,
}

#[derive(Accounts)]
pub struct MintReferralReward<'info> {
    #[account(seeds = [SALE_SEED], bump = sale.bump)]
    pub sale: Account<'info, SaleState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub purchase_record: Account<'info, PurchaseRecord>,
    /// CHECK: Must exactly match the immutable/current audited attribution.
    #[account(address = purchase_record.referrer)]
    pub referrer: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [REFERRAL_REWARD_SEED, purchase_record.key().as_ref()],
        bump
    )]
    /// CHECK: PDA is created and initialized as a Token-2022 mint in the instruction.
    pub reward_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        address = get_associated_token_address_with_program_id(
            &referrer.key(),
            &reward_mint.key(),
            &token_2022::ID
        )
    )]
    /// CHECK: Exact Token-2022 ATA address is enforced and created in the instruction.
    pub reward_token_account: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct SaleState {
    pub authority: Pubkey,
    pub pending_authority: Pubkey,
    pub treasury: Pubkey,
    pub sol_usd_feed_id: [u8; 32],
    pub max_price_age_seconds: u64,
    pub max_confidence_bps: u16,
    pub emergency_paused: bool,
    pub public_sale_enabled: bool,
    pub smoke_test_enabled: bool,
    pub smoke_test_retired: bool,
    pub smoke_test_buyer: Pubkey,
    pub smoke_test_sold: u16,
    pub public_prices_cents: [u64; 4],
    pub public_caps: [u16; 4],
    pub public_sold: [u16; 4],
    pub bump: u8,
    pub reserved: [u8; 64],
}

#[account]
#[derive(InitSpace)]
pub struct PurchaseRecord {
    pub buyer: Pubkey,
    pub referrer: Pubkey,
    pub tier: u8,
    pub is_smoke_test: bool,
    pub usd_price_cents: u64,
    pub paid_lamports: u64,
    pub oracle_price: i64,
    pub oracle_exponent: i32,
    pub oracle_confidence: u64,
    pub oracle_publish_time: i64,
    pub certificate_mint: Pubkey,
    pub client_order_id: [u8; 16],
    pub purchased_at: i64,
    pub delivered: bool,
    pub referral_reward_minted: bool,
    pub referral_reward_mint: Pubkey,
    pub last_referral_evidence_hash: [u8; 32],
    pub bump: u8,
    pub reserved: [u8; 31],
}

struct NftMetadata {
    name: String,
    symbol: String,
    uri: String,
    attributes: Vec<(String, String)>,
}

#[allow(clippy::too_many_arguments)]
fn mint_wallet_bound_nft<'info>(
    payer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    sale: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    token_account: AccountInfo<'info>,
    system_program_info: AccountInfo<'info>,
    token_program_info: AccountInfo<'info>,
    associated_token_program_info: AccountInfo<'info>,
    mint_signer_seeds: &[&[u8]],
    sale_signer_seeds: &[&[u8]],
    metadata: NftMetadata,
) -> Result<()> {
    require!(mint.lamports() == 0, SaleError::MintAlreadyExists);
    require!(
        token_account.lamports() == 0,
        SaleError::TokenAccountAlreadyExists
    );

    let mint_key = *mint.key;
    let sale_key = *sale.key;
    let token_metadata = TokenMetadata {
        update_authority: OptionalNonZeroPubkey::try_from(Some(sale_key))
            .map_err(|_| error!(SaleError::InvalidAuthority))?,
        mint: mint_key,
        name: metadata.name.clone(),
        symbol: metadata.symbol.clone(),
        uri: metadata.uri.clone(),
        additional_metadata: metadata.attributes,
    };
    let base_len = ExtensionType::try_calculate_account_len::<SplMint>(&[
        ExtensionType::MetadataPointer,
        ExtensionType::NonTransferable,
    ])
    .map_err(|_| error!(SaleError::InvalidMintSize))?;
    let mint_space = base_len
        .checked_add(
            token_metadata
                .tlv_size_of()
                .map_err(|_| error!(SaleError::InvalidMintSize))?,
        )
        .ok_or(SaleError::MathOverflow)?;
    let rent_lamports = Rent::get()?.minimum_balance(mint_space);

    let mint_signers = [mint_signer_seeds];
    system_program::create_account(
        CpiContext::new_with_signer(
            system_program_info.clone(),
            CreateAccount {
                from: payer.clone(),
                to: mint.clone(),
            },
            &mint_signers,
        ),
        rent_lamports,
        mint_space as u64,
        &token_2022::ID,
    )?;

    non_transferable_mint_initialize(CpiContext::new(
        token_program_info.clone(),
        NonTransferableMintInitialize {
            token_program_id: token_program_info.clone(),
            mint: mint.clone(),
        },
    ))?;
    metadata_pointer_initialize(
        CpiContext::new(
            token_program_info.clone(),
            MetadataPointerInitialize {
                token_program_id: token_program_info.clone(),
                mint: mint.clone(),
            },
        ),
        Some(sale_key),
        Some(mint_key),
    )?;
    token_2022::initialize_mint2(
        CpiContext::new(
            token_program_info.clone(),
            InitializeMint2 { mint: mint.clone() },
        ),
        0,
        &sale_key,
        None,
    )?;

    let sale_signers = [sale_signer_seeds];
    token_metadata_initialize(
        CpiContext::new_with_signer(
            token_program_info.clone(),
            TokenMetadataInitialize {
                program_id: token_program_info.clone(),
                metadata: mint.clone(),
                update_authority: sale.clone(),
                mint_authority: sale.clone(),
                mint: mint.clone(),
            },
            &sale_signers,
        ),
        metadata.name,
        metadata.symbol,
        metadata.uri,
    )?;

    associated_token::create(CpiContext::new(
        associated_token_program_info,
        associated_token::Create {
            payer: payer.clone(),
            associated_token: token_account.clone(),
            authority: owner,
            mint: mint.clone(),
            system_program: system_program_info,
            token_program: token_program_info.clone(),
        },
    ))?;

    token_2022::mint_to(
        CpiContext::new_with_signer(
            token_program_info.clone(),
            MintTo {
                mint: mint.clone(),
                to: token_account,
                authority: sale.clone(),
            },
            &sale_signers,
        ),
        1,
    )?;
    token_2022::set_authority(
        CpiContext::new_with_signer(
            token_program_info,
            SetAuthority {
                account_or_mint: mint,
                current_authority: sale,
            },
            &sale_signers,
        ),
        AuthorityType::MintTokens,
        None,
    )?;
    Ok(())
}

fn certificate_metadata(tier: u8) -> Result<NftMetadata> {
    let (name, uri, tier_label, rights) = match tier {
        0 => (
            "Turing Node Certificate — L1",
            "https://meta9898.shop/assets/nodes/metadata/l1.json",
            "L1 Explorer",
            "Node rights subject to the published agreement",
        ),
        1 => (
            "Turing Node Certificate — L2",
            "https://meta9898.shop/assets/nodes/metadata/l2.json",
            "L2 Builder",
            "Node rights subject to the published agreement",
        ),
        2 => (
            "Turing Node Certificate — L3",
            "https://meta9898.shop/assets/nodes/metadata/l3.json",
            "L3 Co-Creator",
            "Node rights subject to the published agreement",
        ),
        3 => (
            "Turing Node Certificate — L4",
            "https://meta9898.shop/assets/nodes/metadata/l4.json",
            "L4 Core Market Agent",
            "Node rights subject to the published agreement",
        ),
        SMOKE_TEST_TIER => (
            "TNODE Mainnet Smoke Test",
            "https://meta9898.shop/assets/nodes/metadata/test.json",
            "TEST ONLY",
            "No node, staking, referral, revenue, or economic rights",
        ),
        _ => return err!(SaleError::InvalidTier),
    };
    Ok(NftMetadata {
        name: name.to_string(),
        symbol: "TNODE".to_string(),
        uri: uri.to_string(),
        attributes: vec![
            ("Tier".to_string(), tier_label.to_string()),
            (
                "Transferability".to_string(),
                "Non-transferable".to_string(),
            ),
            ("Network".to_string(), "Solana Mainnet".to_string()),
            ("Rights".to_string(), rights.to_string()),
        ],
    })
}

fn referral_reward_metadata(tier: u8) -> Result<NftMetadata> {
    let reward_usd = match tier {
        0 => 100,
        1 => 500,
        2 => 1_000,
        3 => 5_000,
        _ => return err!(SaleError::InvalidTier),
    };
    Ok(NftMetadata {
        name: format!("Turing Referral Reward — {} U", reward_usd),
        symbol: "TREF".to_string(),
        uri: format!(
            "https://meta9898.shop/assets/nodes/metadata/referral-l{}.json",
            usize::from(tier) + 1
        ),
        attributes: vec![
            (
                "Reward reference value".to_string(),
                format!("{} U", reward_usd),
            ),
            (
                "Source tier".to_string(),
                format!("L{}", usize::from(tier) + 1),
            ),
            (
                "Transferability".to_string(),
                "Non-transferable".to_string(),
            ),
            ("Network".to_string(), "Solana Mainnet".to_string()),
        ],
    })
}

fn confidence_within_limit(price: i64, confidence: u64, max_bps: u16) -> Result<bool> {
    require!(price > 0, SaleError::InvalidOraclePrice);
    let left = u128::from(confidence)
        .checked_mul(10_000)
        .ok_or(SaleError::MathOverflow)?;
    let right = u128::from(price as u64)
        .checked_mul(u128::from(max_bps))
        .ok_or(SaleError::MathOverflow)?;
    Ok(left <= right)
}

/// Converts a USD-cent amount to lamports using a Pyth fixed-point SOL/USD price.
/// The result is always rounded up so the treasury is never underpaid by truncation.
fn usd_cents_to_lamports(usd_cents: u64, price: i64, exponent: i32) -> Result<u64> {
    require!(usd_cents > 0, SaleError::InvalidUsdAmount);
    require!(price > 0, SaleError::InvalidOraclePrice);
    let price_u128 = price as u128;
    let mut numerator = u128::from(usd_cents)
        .checked_mul(LAMPORTS_PER_SOL_U128)
        .ok_or(SaleError::MathOverflow)?;
    let mut denominator = price_u128.checked_mul(100).ok_or(SaleError::MathOverflow)?;

    if exponent < 0 {
        let scale = checked_pow10(exponent.unsigned_abs())?;
        numerator = numerator
            .checked_mul(scale)
            .ok_or(SaleError::MathOverflow)?;
    } else if exponent > 0 {
        let scale = checked_pow10(exponent as u32)?;
        denominator = denominator
            .checked_mul(scale)
            .ok_or(SaleError::MathOverflow)?;
    }

    let quotient = numerator
        .checked_add(denominator.checked_sub(1).ok_or(SaleError::MathOverflow)?)
        .ok_or(SaleError::MathOverflow)?
        .checked_div(denominator)
        .ok_or(SaleError::MathOverflow)?;
    u64::try_from(quotient).map_err(|_| error!(SaleError::MathOverflow))
}

fn checked_pow10(exponent: u32) -> Result<u128> {
    require!(exponent <= 18, SaleError::UnsupportedOracleExponent);
    10_u128
        .checked_pow(exponent)
        .ok_or_else(|| error!(SaleError::MathOverflow))
}

#[event]
pub struct SaleInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub smoke_test_buyer: Pubkey,
    pub public_sale_enabled: bool,
}

#[event]
pub struct SaleStatusUpdated {
    pub emergency_paused: bool,
    pub public_sale_enabled: bool,
    pub smoke_test_enabled: bool,
}

#[event]
pub struct SmokeTestBuyerUpdated {
    pub smoke_test_buyer: Pubkey,
}

#[event]
pub struct SmokeTestRetired {
    pub sold: u16,
}

#[event]
pub struct OracleLimitsUpdated {
    pub max_price_age_seconds: u64,
    pub max_confidence_bps: u16,
}

#[event]
pub struct AuthorityProposed {
    pub current_authority: Pubkey,
    pub pending_authority: Pubkey,
}

#[event]
pub struct AuthorityAccepted {
    pub previous_authority: Pubkey,
    pub new_authority: Pubkey,
}

#[event]
pub struct NodePurchased {
    pub purchase_record: Pubkey,
    pub buyer: Pubkey,
    pub referrer: Pubkey,
    pub tier: u8,
    pub is_smoke_test: bool,
    pub usd_price_cents: u64,
    pub paid_lamports: u64,
    pub oracle_price: i64,
    pub oracle_exponent: i32,
    pub oracle_publish_time: i64,
    pub certificate_mint: Pubkey,
    pub client_order_id: [u8; 16],
}

#[event]
pub struct NodeDelivered {
    pub purchase_record: Pubkey,
    pub buyer: Pubkey,
    pub delivered_at: i64,
}

#[event]
pub struct ReferralRewardMinted {
    pub purchase_record: Pubkey,
    pub referrer: Pubkey,
    pub tier: u8,
    pub reward_mint: Pubkey,
}

#[event]
pub struct ReferralReviewed {
    pub purchase_record: Pubkey,
    pub previous_referrer: Pubkey,
    pub new_referrer: Pubkey,
    pub evidence_hash: [u8; 32],
    pub reviewed_at: i64,
}

#[error_code]
pub enum SaleError {
    #[msg("The signer is not authorized for this operation.")]
    Unauthorized,
    #[msg("The sale is paused.")]
    SalePaused,
    #[msg("Public node sales are not enabled.")]
    PublicSaleDisabled,
    #[msg("The Mainnet smoke-test purchase path is disabled.")]
    SmokeTestDisabled,
    #[msg("The Mainnet smoke-test path has been permanently retired.")]
    SmokeTestRetired,
    #[msg("Only the designated smoke-test buyer can use this tier.")]
    SmokeTestBuyerOnly,
    #[msg("A smoke-test buyer has not been configured.")]
    SmokeTestBuyerMissing,
    #[msg("The smoke-test certificate was already purchased.")]
    SmokeTestAlreadySold,
    #[msg("The one-time Mainnet smoke test must succeed before public sale can be enabled.")]
    SmokeTestRequired,
    #[msg("The smoke-test certificate has no referral reward.")]
    SmokeTestHasNoReferral,
    #[msg("The smoke-test certificate carries no node delivery or economic rights.")]
    SmokeTestHasNoRights,
    #[msg("Unknown node tier.")]
    InvalidTier,
    #[msg("This node tier is sold out.")]
    TierSoldOut,
    #[msg("The supplied treasury does not match the fixed treasury.")]
    InvalidTreasury,
    #[msg("The Pyth price is invalid, stale, unverified, or for the wrong feed.")]
    InvalidOraclePrice,
    #[msg("The Pyth confidence interval is wider than the configured limit.")]
    OracleConfidenceTooWide,
    #[msg("Oracle safety limits are outside the permitted range.")]
    InvalidOracleLimits,
    #[msg("The SOL amount exceeds the buyer's maximum slippage limit.")]
    SlippageExceeded,
    #[msg("Self-referrals are not permitted.")]
    SelfReferral,
    #[msg("The referrer account does not match the recorded attribution.")]
    InvalidReferrer,
    #[msg("This purchase has no referrer.")]
    NoReferrer,
    #[msg("Node delivery has not been finalized.")]
    NotDelivered,
    #[msg("Node delivery was already finalized.")]
    AlreadyDelivered,
    #[msg("The referral reward was already minted.")]
    ReferralRewardAlreadyMinted,
    #[msg("Referral attribution is already finalized by reward issuance.")]
    ReferralAlreadyFinalized,
    #[msg("A non-zero evidence hash is required for referral review.")]
    EvidenceHashRequired,
    #[msg("Invalid authority address.")]
    InvalidAuthority,
    #[msg("Invalid USD amount.")]
    InvalidUsdAmount,
    #[msg("The oracle exponent is outside the supported range.")]
    UnsupportedOracleExponent,
    #[msg("An arithmetic operation overflowed.")]
    MathOverflow,
    #[msg("The certificate mint already exists.")]
    MintAlreadyExists,
    #[msg("The certificate token account already exists.")]
    TokenAccountAlreadyExists,
    #[msg("The Token-2022 mint size could not be calculated.")]
    InvalidMintSize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_one_usd_at_one_hundred_fifty_dollars_per_sol() {
        assert_eq!(
            usd_cents_to_lamports(100, 15_000_000_000, -8).unwrap(),
            6_666_667
        );
    }

    #[test]
    fn rounds_treasury_payment_up() {
        assert_eq!(usd_cents_to_lamports(100, 3, 0).unwrap(), 333_333_334);
    }

    #[test]
    fn converts_public_tiers_at_two_hundred_dollars_per_sol() {
        assert_eq!(
            usd_cents_to_lamports(100_000, 20_000_000_000, -8).unwrap(),
            5_000_000_000
        );
        assert_eq!(
            usd_cents_to_lamports(5_000_000, 20_000_000_000, -8).unwrap(),
            250_000_000_000
        );
    }

    #[test]
    fn enforces_confidence_ratio() {
        assert!(confidence_within_limit(15_000_000_000, 100_000_000, 100).unwrap());
        assert!(!confidence_within_limit(15_000_000_000, 200_000_000, 100).unwrap());
    }

    #[test]
    fn smoke_test_metadata_disclaims_rights() {
        let metadata = certificate_metadata(SMOKE_TEST_TIER).unwrap();
        assert!(metadata.name.contains("Smoke Test"));
        assert!(metadata
            .attributes
            .iter()
            .any(|(key, value)| key == "Rights" && value.starts_with("No node")));
    }
}
