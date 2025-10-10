import { DataTypes, Model, Sequelize } from 'sequelize';

export class Delivery extends Model {
  public id!: number;
  public user_id!: number;
  public customer_id!: number | null;
  public delivery_date!: string;
  public quantity!: number;
  public status!: 'delivered' | 'absent' | 'mixed' | 'no_entry';
  public month_year!: string;
  public rate_per_litre!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export default (sequelize: Sequelize) => {
  Delivery.init({
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['delivered', 'absent', 'mixed', 'no_entry']],
      },
    },
    month_year: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    rate_per_litre: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
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
    modelName: 'Delivery',
    tableName: 'deliveries',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'delivery_date'],
      },
      {
        fields: ['user_id', 'month_year'],
      },
      {
        fields: ['customer_id'],
      },
    ],
  });

  return Delivery;
};
