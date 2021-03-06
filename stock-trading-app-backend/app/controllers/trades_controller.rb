class TradesController < ApplicationController

  def index
    trades=Trade.all
    render json: TradeSerializer.new(trades).to_serialized_json
  end

  def create
    user=User.find_by(username: params[:username])
    stock=Stock.find_or_create_by(ticker: params[:ticker])
    trade = Trade.create(stock_id: stock.id,user_id:user.id,price:params[:price],direction:params[:direction],quantity:params[:quantity])
    position=Position.find_or_create_by(user_id: user.id,stock_id: stock.id)
    position.update_position(price:params[:price].to_f,direction:params[:direction],quantity:params[:quantity].to_i)
    render json: PositionSerializer.new(position).to_serialized_json
  end

end
