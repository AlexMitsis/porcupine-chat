import uuid
import string
import secrets
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


def generate_room_code():
    """Generate a unique 6-character room code"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    room_code = models.CharField(max_length=10, unique=True, default=generate_room_code)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    max_members = models.IntegerField(default=100)

    class Meta:
        db_table = 'rooms'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.room_code})"

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()

    def clean(self):
        if len(self.room_code) != 6:
            raise ValidationError('Room code must be 6 characters long')


class RoomMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_memberships')
    public_key = models.TextField()  # Base64 encoded ECDH public key
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    class Meta:
        db_table = 'room_memberships'
        unique_together = ['room', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"

    def save(self, *args, **kwargs):
        # Set as admin if they're the room creator
        if self.user == self.room.created_by:
            self.is_admin = True
        super().save(*args, **kwargs)


class RoomInvite(models.Model):
    """Optional: Track room invites with expiration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='invites')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    invite_code = models.CharField(max_length=32, unique=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    uses_remaining = models.IntegerField(default=1)  # -1 for unlimited
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_invites'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite for {self.room.name}"

    @property
    def is_expired(self):
        from django.utils import timezone
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    @property
    def is_valid(self):
        return not self.is_expired and (self.uses_remaining == -1 or self.uses_remaining > 0)