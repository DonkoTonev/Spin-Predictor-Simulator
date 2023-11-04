from flask import Flask, jsonify, render_template, request, flash, redirect, url_for
from flask_login import LoginManager, login_user, current_user, login_required, logout_user, UserMixin
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'teorerpt'
app.config['MONGO_URI'] = "mongodb+srv://printhash:Zaryabashar2023printhash@printhash.ziemuhb.mongodb.net/schedulerapi?retryWrites=true&w=majority"

login_manager = LoginManager(app)
login_manager.login_view = 'login'


client = MongoClient(app.config['MONGO_URI'])
db = client['spinpredictor']
users_collection = db['user']

class User(UserMixin):
    def __init__(self, username, password, role):
        self.username = username
        self.password = generate_password_hash(password)
        self.role = role

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def get_id(self):
        return self.username

@login_manager.user_loader
def load_user(user_id):
    user_data = users_collection.find_one({'username': user_id})
    if user_data:
        return User(username=user_data['username'], password=user_data['password'], role=user_data['role'])
    return None

@app.route('/createadmin',methods=['GET','POST'])
def random_function():
    admin = users_collection.find_one({'role': 'admin'})
    if admin:
        return 'Admin user already exists'

    admin_username = 'admin'
    admin_password = 'admin_password'
    admin_role = 'admin'
    admin = User(username=admin_username, password=admin_password, role=admin_role)   
    users_collection.insert_one(admin.__dict__)

    return 'Admin user created successfully.'

@app.route('/register', methods=['GET', 'POST'])
@login_required
def register():
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        logout_user()
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        username = request.form.get('email')
        password = request.form.get('password')
        role = 'user'

        if not username or not password or not role:
            flash('Please provide all required fields.', 'danger')
            return redirect(url_for('register'))

        if users_collection.find_one({'username': username}):
            flash('Username already exists.', 'error')
            return redirect(url_for('register'))

        user = User(username=username, password=password, role=role)
        users_collection.insert_one(user.__dict__)

        flash('User registered successfully.', 'success')
        return redirect(url_for('admin'))

    return render_template('register.html')

@app.route('/', methods=['GET', 'POST'])
def login():
    image_path = '/static/image.jpg' 
    if current_user.is_authenticated:
        if current_user.role == 'admin':
            return redirect(url_for('admin'))
        elif current_user.role == 'user':
            return redirect(url_for('user'))

    if request.method == 'POST':
        username = request.form.get('email')
        password = request.form.get('password')

        if not username or not password:
            flash('Please provide username and password.', 'danger')
            return redirect(url_for('login'))

        user_data = users_collection.find_one({'username': username})
        if not user_data or not check_password_hash(user_data['password'], password):
            flash('Invalid credentials.', 'danger')
            return redirect(url_for('login'))

        user = User(username=user_data['username'], password=user_data['password'], role=user_data['role'])
        login_user(user)

        if user.role == 'admin':
            return redirect(url_for('admin'))
        elif user.role == 'user':
            return redirect(url_for('user'))

    return render_template('login.html', image_path=image_path)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/admin')
@login_required
def admin():
    if current_user.role != 'admin':
        flash('Access denied.', 'danger')
        logout_user()
        return redirect(url_for('login'))

    users = users_collection.find()
    return render_template('admin.html', users=users)

@app.route('/admin/user/edit/<user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    if current_user.role != 'admin':
        flash('Access denied.', 'error')
        logout_user()
        return redirect(url_for('login'))

    user_data = users_collection.find_one({'username': user_id})
    if not user_data:
        flash('User not found.', 'error')
        return redirect(url_for('admin'))

    if request.method == 'POST':
        username = request.form['username']
        role = request.form['role']

        users_collection.update_one({'username': user_id}, {"$set": {'username': username, 'role': role}})
        flash('User details updated successfully.', 'success')
        return redirect(url_for('admin'))

    return render_template('edit_user.html', user=user_data)

@app.route('/admin/user/delete/<user_id>', methods=['POST','GET'])
@login_required
def delete_user(user_id):
    if current_user.role != 'admin':
        flash('Access denied.', 'error')
        logout_user()
        return redirect(url_for('login'))

    user_data = users_collection.find_one({'username': user_id})
    if not user_data:
        flash('User not found.', 'error')
        return redirect(url_for('admin'))

    users_collection.delete_one({'username': user_id})
    flash('User deleted successfully.', 'success')
    return redirect(url_for('admin'))

@app.route('/user')
@login_required
def user():
    if current_user.role != 'user':
        flash('Access denied.', 'danger')
        logout_user()
        return redirect(url_for('login'))

    matrix = [
        [32, 15, 19, 4, 21, 2],
        [25, 17, 34, 6, 27, 13],
        [36, 11, 30, 8, 23, 10],
        [5, 24, 16, 33, 1, 20],
        [14, 31, 9, 22, 18, 29],
        [7, 28, 12, 35, 3, 26]
    ]
    spin_counts_row = [0, 0, 0, 0, 0, 0]
    spin_counts_col = [0, 0, 0, 0, 0, 0]

    return render_template('index.html', matrix=matrix, spin_counts_row=spin_counts_row, spin_counts_col=spin_counts_col)

@app.after_request
def after_request(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=8080)
