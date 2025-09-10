from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.rooms.models import Room, RoomMembership
from .models import Message, MessageRecipient
from .serializers import MessageSerializer, MessageCreateSerializer, MessageRecipientSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET: List messages in a room
    POST: Send a new message
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(Room, id=room_id, is_active=True)
        
        # Verify user is member of this room
        membership = room.memberships.filter(
            user=self.request.user,
            is_active=True
        ).first()
        
        if not membership:
            return Message.objects.none()
        
        return Message.objects.filter(
            room=room,
            is_active=True
        ).select_related('sender').prefetch_related('recipients')
    
    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(Room, id=room_id, is_active=True)
        
        # Verify user is member of this room
        membership = room.memberships.filter(
            user=self.request.user,
            is_active=True
        ).first()
        
        if not membership:
            return Response(
                {'error': 'You are not a member of this room'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Save message
        message = serializer.save(room=room)
        
        # Create message recipients for all active room members
        active_members = room.memberships.filter(is_active=True).select_related('user')
        recipients = []
        for member in active_members:
            if member.user != self.request.user:  # Don't create recipient for sender
                recipients.append(MessageRecipient(
                    message=message,
                    user=member.user
                ))
        
        if recipients:
            MessageRecipient.objects.bulk_create(recipients)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Message details
    PUT/PATCH: Update message (sender only, within time limit)
    DELETE: Delete message (sender only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        return Message.objects.filter(
            sender=self.request.user,
            is_active=True
        ).select_related('sender', 'room')
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_delivered(request, message_id):
    """Mark a message as delivered for the current user"""
    message = get_object_or_404(Message, id=message_id, is_active=True)
    
    # Verify user is member of the room
    membership = message.room.memberships.filter(
        user=request.user,
        is_active=True
    ).first()
    
    if not membership:
        return Response(
            {'error': 'You are not a member of this room'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update or create recipient record
    recipient, created = MessageRecipient.objects.get_or_create(
        message=message,
        user=request.user,
        defaults={'delivered_at': timezone.now()}
    )
    
    if not created and not recipient.delivered_at:
        recipient.delivered_at = timezone.now()
        recipient.save()
    
    return Response({'message': 'Message marked as delivered'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_read(request, message_id):
    """Mark a message as read for the current user"""
    message = get_object_or_404(Message, id=message_id, is_active=True)
    
    # Verify user is member of the room
    membership = message.room.memberships.filter(
        user=request.user,
        is_active=True
    ).first()
    
    if not membership:
        return Response(
            {'error': 'You are not a member of this room'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update or create recipient record
    recipient, created = MessageRecipient.objects.get_or_create(
        message=message,
        user=request.user,
        defaults={
            'delivered_at': timezone.now(),
            'read_at': timezone.now()
        }
    )
    
    if not created:
        if not recipient.delivered_at:
            recipient.delivered_at = timezone.now()
        if not recipient.read_at:
            recipient.read_at = timezone.now()
        recipient.save()
    
    return Response({'message': 'Message marked as read'}, status=status.HTTP_200_OK)