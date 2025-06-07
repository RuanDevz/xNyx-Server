module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define("Report", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contentType: {
      type: DataTypes.ENUM('free', 'vip'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Link não funcionando",
    },
    reportedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  Report.associate = function(models) {
    // Associação com User
    Report.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Report;
};