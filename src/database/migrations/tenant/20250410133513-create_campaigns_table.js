'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'inactive',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
  })
    await queryInterface.addIndex('campaigns', ['name'], {
      unique: true,
      name: 'campaigns_name_index'
    });
    await queryInterface.addIndex('campaigns', ['startDate'], {
      name: 'campaigns_start_date_index'
    });
    await queryInterface.addIndex('campaigns', ['endDate'], {
      name: 'campaigns_end_date_index'
    });
    await queryInterface.addIndex('campaigns', ['status'], {
      name: 'campaigns_status_index'
    });
    await queryInterface.addIndex('campaigns', ['createdAt'], {
      name: 'campaigns_created_at_index'
    });
    await queryInterface.addIndex('campaigns', ['updatedAt'], {
      name: 'campaigns_updated_at_index'
    });
  
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('campaigns');
  }
};
