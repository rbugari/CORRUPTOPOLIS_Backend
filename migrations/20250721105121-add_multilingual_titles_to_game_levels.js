'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game_levels', 'title_en', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('game_levels', 'title_es', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.removeColumn('game_levels', 'title');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game_levels', 'title_en');
    await queryInterface.removeColumn('game_levels', 'title_es');
    await queryInterface.addColumn('game_levels', 'title', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
  }
};