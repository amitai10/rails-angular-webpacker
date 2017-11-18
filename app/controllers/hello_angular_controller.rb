class HelloAngularController < ApplicationController
  def index; end

  def name
    name = %w[Jack Smith Sara Linda Josh Amitai].sample
    render json: { name: name }
  end
end
