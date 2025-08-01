'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game_levels', 'description_en', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('game_levels', 'description_es', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.removeColumn('game_levels', 'description_visual');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game_levels', 'description_en');
    await queryInterface.removeColumn('game_levels', 'description_es');
    await queryInterface.addColumn('game_levels', 'description_visual', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
};