module.exports = (sequelize, DataTypes) => {
  const BannedIp = sequelize.define('BannedIp', {
    ip: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    banned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'banned_ips',
    timestamps: false
  });

  return BannedIp;
};
