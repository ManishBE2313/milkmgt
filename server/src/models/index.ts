import { Sequelize } from 'sequelize';
import UserModel, { User } from './User';
import CustomerModel, { Customer } from './Customer';
import DeliveryModel, { Delivery } from './Delivery';

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'milkmgt',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Initialize models
const models = {
  User: UserModel(sequelize),
  Customer: CustomerModel(sequelize),
  Delivery: DeliveryModel(sequelize),
};

// Define associations
models.User.hasMany(models.Customer, {
  foreignKey: 'user_id',
  as: 'customers',
});

models.User.hasMany(models.Delivery, {
  foreignKey: 'user_id',
  as: 'deliveries',
});

models.Customer.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user',
});

models.Customer.hasMany(models.Delivery, {
  foreignKey: 'customer_id',
  as: 'deliveries',
});

models.Delivery.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user',
});

models.Delivery.belongsTo(models.Customer, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// Sync database
export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true }); // Use alter to update existing tables
    console.log('✅ Database synced with Sequelize models');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

export { sequelize, models, User, Customer, Delivery };
