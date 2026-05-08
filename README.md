# ShopEase E-Commerce Website

A premium e-commerce platform built with Flask and TiDB Cloud.

## Setup Instructions

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Configure environment variables:**
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Fill in your TiDB Cloud credentials and a secret key in the `.env` file.
4.  **Run the application:**
    ```bash
    python app.py
    ```

## Project Structure

- `app.py`: Main Flask application.
- `db_config.py`: Database connection and pooling configuration.
- `common.js`: Shared frontend logic (cart, wishlist, auth).
- `assets/`: Static assets (images, CSS).
- `*.html`: Frontend templates.
