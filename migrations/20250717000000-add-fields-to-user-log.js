'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_logs', 'pc_current', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('user_logs', 'inf_current', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('user_logs', 'be_current', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_logs', 'pc_current');
    await queryInterface.removeColumn('user_logs', 'inf_current');
    await queryInterface.removeColumn('user_logs', 'be_current');
  }
};