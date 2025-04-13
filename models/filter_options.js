// models/FilterOption.js
module.exports = (sequelize, DataTypes) => {
    const FilterOption = sequelize.define('FilterOption', {
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['actress', 'feature']], // Definir os tipos permitidos
        },
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  
    return FilterOption;
  };
  