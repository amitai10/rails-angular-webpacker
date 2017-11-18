require 'test_helper'

class HelloAngularControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get hello_angular_index_url
    assert_response :success
  end

end
