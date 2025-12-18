module.exports = {
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/01984ec8-f312-3628-b93b-4a06b8ca64d5',
        permanent: true,
      },
    ]
  },
}