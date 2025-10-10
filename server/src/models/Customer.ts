import { DataTypes, Model, Sequelize } from 'sequelize';

export class Customer extends Model {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public address!: string | null;
  public contact!: string | null;
  public rate_per_litre!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

export default (sequelize: Sequelize) => {
  Customer.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rate_per_litre: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'name'],
      },
    ],
  });

  return Customer;
};
