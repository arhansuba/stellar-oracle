# 1. Run the complete setup script
chmod +x complete-setup.sh
./complete-setup.sh

# 2. Navigate to the project
cd stellar-price-oracle

# 3. Make sure you have Stellar CLI configured
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

stellar keys generate alice --global
stellar keys fund alice --network testnet

# 4. Deploy everything
chmod +x quick-deploy.sh
./quick-deploy.sh

# 5. Edit .env with your secret key (shown in output)
# 6. Visit http://localhost:3000 🎉