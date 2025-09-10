from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Message, MessageRecipient
from apps.accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'sender_id', 'encrypted_content', 
            'timestamp', 'message_type', 'is_active'
        ]
        read_only_fields = ['id', 'timestamp', 'sender']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['room', 'encrypted_content', 'message_type']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class MessageRecipientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MessageRecipient
        fields = ['id', 'message', 'user', 'delivered_at', 'read_at']
        read_only_fields = ['id']