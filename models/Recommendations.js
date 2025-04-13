module.exports = (sequelize, DataTypes) => {
    const Recommendation = sequelize.define('Recommendation', {
      title: {
        type: DataTypes.STRING,
        allowNull: false, 
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false, 
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false, 
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', 
      },
    }, {
      // Opções do modelo
      timestamps: true, 
      tableName: 'recommendations', 
    });
  
   
  
    return Recommendation;
  };
  