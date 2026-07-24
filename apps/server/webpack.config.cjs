module.exports = (options) => {
  const [nodeExternals] = options.externals

  return {
    ...options,
    externals: [
      (context, callback) => {
        const request = context.request

        if (request === '@hms/core' || request?.startsWith('@hms/core/')) {
          return callback()
        }

        return nodeExternals(context, callback)
      },
    ],
  }
}
