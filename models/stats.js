// models/stats.js

module.exports = (sequelize, DataTypes) => {
  const Stats = sequelize.define("Stats", {
    totalUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Valor inicial
    },
    totalVIPs: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Valor inicial
    },
    totalContentRecommendations: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Valor inicial
    },
  });

  return Stats;
};
