module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isVip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      resetPasswordToken: { 
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: { 
        type: DataTypes.DATE,
        allowNull: true,
      },
      vipExpirationDate: { 
        type: DataTypes.DATE,
        allowNull: true, 
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      recentlyViewed: { 
        type: DataTypes.ARRAY(DataTypes.STRING), 
        allowNull: true,
        defaultValue: [], 
      },
      transactions: { 
        type: DataTypes.JSONB, 
        allowNull: true,
        defaultValue: [], 
      },
      favorites: { 
        type: DataTypes.JSONB, 
        allowNull: true,
        defaultValue: [], 
      },
      stripeSubscriptionId: { 
        type: DataTypes.STRING, 
        allowNull: true,
      },
      isDisabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    }, {});
  
    return User;
  };
  