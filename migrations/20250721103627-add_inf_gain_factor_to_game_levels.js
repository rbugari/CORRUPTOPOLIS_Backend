'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game_levels', 'inf_gain_factor', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game_levels', 'inf_gain_factor');
  }
};