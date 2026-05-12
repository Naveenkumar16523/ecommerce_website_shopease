from marshmallow import Schema, fields, validates, ValidationError, EXCLUDE
import re

class SignupSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    name = fields.Str(required=True, validate=lambda x: 2 <= len(x) <= 100)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: 8 <= len(x) <= 128)

    @validates('password')
    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'\d', value):
            raise ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError("Password must contain at least one special character.")

class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class ProfileUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    address = fields.Str(required=False, validate=lambda x: len(x) <= 500)
    phone = fields.Str(required=False, validate=lambda x: re.match(r'^\+?1?\d{9,15}$', x))
    updated_at = fields.Str(required=True, allow_none=True) # For optimistic locking

class OrderItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    product_id = fields.Int(required=True, validate=lambda x: x >= 1)
    qty = fields.Int(required=True, validate=lambda x: 1 <= x <= 100)
    price = fields.Float(required=False, validate=lambda x: x >= 0)

class ShippingSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    name = fields.Str(required=True, validate=lambda x: 2 <= len(x) <= 100)
    address = fields.Str(required=True, validate=lambda x: 5 <= len(x) <= 500)
    phone = fields.Str(required=True, validate=lambda x: re.match(r'^\+?1?\d{9,15}$', x))
    method = fields.Str(required=False, load_default='Standard', validate=lambda x: len(x) <= 100)

class OrderSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    items = fields.List(fields.Nested(OrderItemSchema), required=True, validate=lambda x: len(x) >= 1)
    total = fields.Float(required=True, validate=lambda x: x >= 0)
    shipping = fields.Nested(ShippingSchema, required=True)

class WishlistToggleSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    product_id = fields.Int(required=True, validate=lambda x: x >= 1)
