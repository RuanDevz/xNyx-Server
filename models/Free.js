// models/Free.js
module.exports = (sequelize, DataTypes) => {
  const Free = sequelize.define("Free", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    slug: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.NOW,
    },
    views: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    },
  });

  return Free;
};