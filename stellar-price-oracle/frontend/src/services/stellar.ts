// frontend/src/services/stellar.ts

import { TransactionResult, StellarAccount } from '../types/oracle';
import * as StellarSdk from 'stellar-sdk';

// Type workaround for Vite env variables
interface ImportMetaEnv {
  VITE_STELLAR_RPC?: string;
  VITE_CONTRACT_ID?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

class StellarService {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private contractId?: string;

  constructor() {
    // Horizon server for account operations
    this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    
    this.networkPassphrase = StellarSdk.Networks.TESTNET;
    this.contractId = ((import.meta as unknown) as ImportMeta).env.VITE_CONTRACT_ID;
  }

  // Generate a new Stellar account
  generateAccount(): StellarAccount {
    const keypair = StellarSdk.Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
  }

  // Fund account with testnet lumens using Friendbot
  async fundAccount(publicKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      return response.ok;
    } catch (error) {
      console.error('Failed to fund account:', error);
      return false;
    }
  }

  // Get account balance using Horizon
  async getBalance(publicKey: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(
        (balance: any) => balance.asset_type === 'native'
      );
      return xlmBalance?.balance || '0';
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Check if account exists and is funded
  async validateAccount(publicKey: string): Promise<boolean> {
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  // Read price from contract (simplified version)
  async readPrice(asset: string): Promise<number | null> {
    if (!this.contractId) {
      console.warn('Contract ID not configured');
      return null;
    }

    try {
      // For now, we'll return null to fall back to API data
      // Contract reading would require more complex Soroban integration
      // that's beyond the scope of this demo
      console.log(`Would read ${asset} price from contract ${this.contractId}`);
      return null;
    } catch (error) {
      console.error('Failed to read price from contract:', error);
      return null;
    }
  }

  // Submit a basic payment transaction (simplified for demo)
  async submitPayment(
    fromAccount: StellarAccount,
    toPublicKey: string,
    amount: string
  ): Promise<TransactionResult> {
    if (!fromAccount.secretKey) {
      throw new Error('Account secret key required for transaction');
    }

    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromAccount.secretKey);
      const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: toPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .addMemo(StellarSdk.Memo.text('Oracle test payment'))
        .setTimeout(180)
        .build();

      transaction.sign(sourceKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        hash: result.hash,
        status: result.successful ? 'success' : 'failed',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to submit payment:', error);
      throw error;
    }
  }

  // Simulate contract price submission (for demo purposes)
  async submitPrice(
    asset: string, 
    price: number, 
    account: StellarAccount
  ): Promise<TransactionResult> {
    if (!this.contractId) {
      throw new Error('Contract ID not configured');
    }

    if (!account.secretKey) {
      throw new Error('Account secret key required for submission');
    }

    try {
      // For demo purposes, we'll simulate a successful contract call
      // In a real implementation, this would use Soroban contract invocation
      
      console.log(`Simulating contract call: set_price(${asset}, ${price})`);
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const mockHash = 'demo_' + Math.random().toString(36).substring(7);
      
      return {
        hash: mockHash,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to submit price to contract:', error);
      throw error;
    }
  }

  // Get transaction details from Horizon
  async getTransaction(hash: string): Promise<any> {
    try {
      // For demo hashes, return mock data
      if (hash.startsWith('demo_')) {
        return {
          hash,
          successful: true,
          created_at: new Date().toISOString(),
          operation_count: 1
        };
      }
      
      return await this.server.transactions().transaction(hash).call();
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  // Create a basic trustline for custom assets
  async createTrustline(
    account: StellarAccount,
    assetCode: string,
    assetIssuer: string
  ): Promise<TransactionResult> {
    if (!account.secretKey) {
      throw new Error('Account secret key required');
    }

    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(account.secretKey);
      const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

      const asset = new StellarSdk.Asset(assetCode, assetIssuer);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: asset,
          })
        )
        .addMemo(StellarSdk.Memo.text(`Trustline for ${assetCode}`))
        .setTimeout(180)
        .build();

      transaction.sign(sourceKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        hash: result.hash,
        status: result.successful ? 'success' : 'failed',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to create trustline:', error);
      throw error;
    }
  }

  // Get account info including balances and sequence
  async getAccountInfo(publicKey: string): Promise<any> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        accountId: account.accountId(),
        sequenceNumber: account.sequenceNumber(),
        balances: account.balances,
        signers: account.signers,
        thresholds: account.thresholds
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  // Get recent transactions for an account
  async getAccountTransactions(publicKey: string, limit = 10): Promise<any[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .call();
      
      return transactions.records;
    } catch (error) {
      console.error('Failed to get account transactions:', error);
      return [];
    }
  }

  // Get network info
  getNetworkInfo() {
    return {
      network: 'testnet',
      horizonUrl: this.server.serverURL.href,
      contractId: this.contractId,
      passphrase: this.networkPassphrase
    };
  }

  // Get current network fees
  async getNetworkFees(): Promise<{ baseFee: string; baseReserve: string }> {
    try {
      const feeStats = await this.server.feeStats();
      return {
        baseFee: feeStats.fee_charged?.mode || StellarSdk.BASE_FEE,
        baseReserve: '0.5' // Standard base reserve
      };
    } catch (error) {
      console.error('Failed to get network fees:', error);
      return {
        baseFee: StellarSdk.BASE_FEE,
        baseReserve: '0.5'
      };
    }
  }

  // Stream account updates (for real-time balance changes)
  streamAccount(publicKey: string, onUpdate: (account: any) => void): () => void {
    const closeStream = this.server
      .accounts()
      .accountId(publicKey)
      .stream({
        onmessage: onUpdate,
        onerror: (error) => console.error('Stream error:', error)
      });

    return closeStream;
  }

  // Utility: Convert XLM to stroops
  xlmToStroops(xlm: number): string {
    return (xlm * 10000000).toString();
  }

  // Utility: Convert stroops to XLM
  stroopsToXlm(stroops: string | number): number {
    return Number(stroops) / 10000000;
  }

  // Utility: Format public key for display
  formatPublicKey(publicKey: string, chars = 8): string {
    if (publicKey.length <= chars * 2) return publicKey;
    return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`;
  }
}

export const stellarService = new StellarService();

// Example usage:
// SUPPORTED_ASSETS.WSOL, SUPPORTED_ASSETS.WBTC, SUPPORTED_ASSETS.WETH