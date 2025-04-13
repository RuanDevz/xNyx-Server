module.exports = (sequelize, DataTypes) => {
    const Request = sequelize.define('Request', {
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', // Status inicial pode ser 'pendente'
      },
      dateRequested: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Define o horário atual quando o pedido é criado
      },
    }, {
      timestamps: false, // Ou 'true', caso queira timestamps automáticos
      tableName: 'requests',
    });
  
    return Request;
  };
  