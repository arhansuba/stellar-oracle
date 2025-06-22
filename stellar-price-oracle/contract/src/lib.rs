#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Address, Symbol, log};

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    /// Set price for a trading pair (provider authorization required)
    pub fn set_price(env: Env, pair: Symbol, price: i64, provider: Address) {
        provider.require_auth();
        
        let timestamp = env.ledger().timestamp();
        let price_key = (symbol_short!("price"), pair.clone());
        let time_key = (symbol_short!("time"), pair.clone());
        let provider_key = (symbol_short!("provider"), pair.clone());
        
        env.storage().instance().set(&price_key, &price);
        env.storage().instance().set(&time_key, &timestamp);
        env.storage().instance().set(&provider_key, &provider);
        
        log!(&env, "Price updated: {} = {} by {}", pair, price, provider);
    }
    
    /// Get latest price for a trading pair
    pub fn get_price(env: Env, pair: Symbol) -> Option<i64> {
        let price_key = (symbol_short!("price"), pair);
        env.storage().instance().get(&price_key)
    }
    
    /// Get price timestamp
    pub fn get_timestamp(env: Env, pair: Symbol) -> Option<u64> {
        let time_key = (symbol_short!("time"), pair);
        env.storage().instance().get(&time_key)
    }
    
    /// Get price provider
    pub fn get_provider(env: Env, pair: Symbol) -> Option<Address> {
        let provider_key = (symbol_short!("provider"), pair);
        env.storage().instance().get(&provider_key)
    }
    
    /// Check if price is fresh (less than max_age seconds old)
    pub fn is_fresh(env: Env, pair: Symbol, max_age: u64) -> bool {
        if let Some(timestamp) = Self::get_timestamp(env.clone(), pair) {
            let current_time = env.ledger().timestamp();
            current_time - timestamp <= max_age
        } else {
            false
        }
    }
}