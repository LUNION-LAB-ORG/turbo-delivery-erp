module.exports = {
  apps: [{
    name: 'erp-website',
    script: 'pnpm',
    args: 'start --port 3003',
    cwd: '/var/www/turbo/prod/turbo-delivery-erp',
    env: {
      NODE_ENV: 'production',
      PORT: 3003 // Port sur lequel l'application va tourner
    }
  }]
}
