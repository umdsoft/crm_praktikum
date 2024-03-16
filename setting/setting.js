module.exports = {
  jwt: {
    secret:
      "!ewqeqe!@#23eqwasdasdxoSCHp3sbG1dgkPlZ3P00m8rAZUSKtNyyok1A5gUJHMLwpnKWZUI48dSN7VSry7AOnxRppxhW6tgBzcYhGH1EdtXqcUm1uGdQeaR",
    tokens: {
      access: {
        type: "access",
        expiresIn: "1d",
      },
      refresh: {
        type: "refresh",
        expiresIn: "2d",
      },
    },
  },
};
