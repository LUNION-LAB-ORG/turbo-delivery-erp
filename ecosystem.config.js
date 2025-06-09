module.exports = {
  apps: [{
    name: 'erp-test-website',
    script: 'pnpm',
    args: 'start --port 3013',
    cwd: '/var/www/turbo/test/turbo-delivery-erp',
    env: {
      NODE_ENV: 'development',
      PORT: 3013 // Port sur lequel l'application va tourner
    }
  }]
}
