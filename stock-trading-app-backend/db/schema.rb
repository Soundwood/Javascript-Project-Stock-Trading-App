# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2019_09_09_031606) do

  create_table "positions", force: :cascade do |t|
    t.integer "size", default: 0
    t.integer "stock_id"
    t.integer "user_id"
    t.decimal "cost", default: "0.0"
    t.decimal "value", default: "0.0"
    t.decimal "realized", default: "0.0"
    t.decimal "unrealized", default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_positions_on_stock_id"
    t.index ["user_id"], name: "index_positions_on_user_id"
  end

  create_table "stocks", force: :cascade do |t|
    t.string "ticker"
    t.decimal "latest_price"
    t.string "name"
    t.integer "shares_outstanding"
    t.decimal "year_low"
    t.decimal "year_high"
    t.decimal "pe_ratio"
    t.decimal "market_cap"
    t.decimal "beta"
    t.decimal "eps"
    t.decimal "div_yield"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "trades", force: :cascade do |t|
    t.integer "stock_id"
    t.integer "user_id"
    t.decimal "price"
    t.string "direction"
    t.integer "quantity"
    t.string "time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_trades_on_stock_id"
    t.index ["user_id"], name: "index_trades_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "cash_balance", default: "0.0"
  end

end
