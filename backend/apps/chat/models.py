from django.db import models
from django.contrib.auth.models import User
import uuid


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    encrypted_content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('system', 'System'),
            ('key_exchange', 'Key Exchange'),
        ],
        default='text'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} in {self.room.name}"


class MessageRecipient(models.Model):
    """Track message delivery status for each room member"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='recipients')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['user', 'delivered_at']),
            models.Index(fields=['user', 'read_at']),
        ]

    def __str__(self):
        return f"Receipt for {self.user.username} - Message {self.message.id}"