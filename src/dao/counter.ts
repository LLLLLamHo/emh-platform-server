import { Sequelize, DataTypes } from 'sequelize';

export function createCounterModule(sequelize: Sequelize) {
  const counter = sequelize.define('Counter', {
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  });

  return counter;
}


