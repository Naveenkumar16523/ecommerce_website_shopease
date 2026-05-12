from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE
import re

class SignupSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))

    @validates('password')
    def validate_password(self, value, **kwargs):
        if not any(c.isupper() for c in value):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in value):
            raise ValidationError("Password must contain at least one number.")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in value):
            raise ValidationError("Password must contain at least one special character.")

class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True)

class ProfileUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    address = fields.Str(validate=validate.Length(max=500))
    phone = fields.Str(validate=validate.Regexp(r'^\+?1?\d{9,15}$', error="Invalid phone number format."))

class OrderItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    product_id = fields.Int(required=True, validate=validate.Range(min=1))
    qty = fields.Int(required=True, validate=validate.Range(min=1, max=100))
    # We snapshot price on server, so we don't strictly need it here for validation, 
    # but we'll allow it if sent for display/logging.
    price = fields.Float(validate=validate.Range(min=0)) 

class ShippingSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    address = fields.Str(required=True, validate=validate.Length(min=5, max=500))
    phone = fields.Str(required=True, validate=validate.Regexp(r'^\+?1?\d{9,15}$'))
    # Checkout UI sends labels like "Cash on Delivery", not only Standard/Express/COD
    method = fields.Str(required=False, load_default='Standard', validate=validate.Length(max=100))

class OrderSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    items = fields.List(fields.Nested(OrderItemSchema), required=True, validate=validate.Length(min=1))
    total = fields.Float(required=True, validate=validate.Range(min=0))
    shipping = fields.Nested(ShippingSchema, required=True)

class WishlistToggleSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    product_id = fields.Int(required=True, validate=validate.Range(min=1))
