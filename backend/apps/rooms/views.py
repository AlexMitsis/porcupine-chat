from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Room, RoomMembership, RoomInvite
from .serializers import (
    RoomSerializer, RoomCreateSerializer, JoinRoomSerializer,
    RoomMembershipSerializer, RoomInviteSerializer
)


class RoomListCreateView(generics.ListCreateAPIView):
    """
    GET: List user's rooms
    POST: Create a new room
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RoomCreateSerializer
        return RoomSerializer
    
    def get_queryset(self):
        # Return rooms where user is a member
        return Room.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
            is_active=True
        ).distinct().prefetch_related('memberships__user')


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Room details
    PUT/PATCH: Update room (admin only)
    DELETE: Delete room (creator only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RoomSerializer
    
    def get_queryset(self):
        return Room.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
            is_active=True
        ).distinct()
    
    def update(self, request, *args, **kwargs):
        room = self.get_object()
        # Check if user is admin
        membership = room.memberships.filter(user=request.user, is_active=True).first()
        if not membership or not membership.is_admin:
            return Response(
                {'error': 'Only room admins can update room settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        room = self.get_object()
        if room.created_by != request.user:
            return Response(
                {'error': 'Only room creator can delete the room'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request):
    """Join a room using room code"""
    serializer = JoinRoomSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        room = serializer.save()
        room_serializer = RoomSerializer(room, context={'request': request})
        return Response({
            'message': f'Successfully joined room "{room.name}"',
            'room': room_serializer.data
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_room(request, room_id):
    """Leave a room"""
    room = get_object_or_404(Room, id=room_id, is_active=True)
    
    try:
        membership = RoomMembership.objects.get(
            room=room,
            user=request.user,
            is_active=True
        )
        membership.is_active = False
        membership.save()
        
        return Response({
            'message': f'Successfully left room "{room.name}"'
        }, status=status.HTTP_200_OK)
    except RoomMembership.DoesNotExist:
        return Response(
            {'error': 'You are not a member of this room'},
            status=status.HTTP_400_BAD_REQUEST
        )


class RoomMembersView(generics.ListAPIView):
    """Get room members"""
    permission_classes = [IsAuthenticated]
    serializer_class = RoomMembershipSerializer
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Verify user is member of this room
        room = get_object_or_404(Room, id=room_id, is_active=True)
        user_membership = room.memberships.filter(
            user=self.request.user,
            is_active=True
        ).first()
        
        if not user_membership:
            return RoomMembership.objects.none()
        
        return room.memberships.filter(is_active=True).select_related('user')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invite(request, room_id):
    """Create an invite link for a room"""
    room = get_object_or_404(Room, id=room_id, is_active=True)
    
    # Check if user is admin
    membership = room.memberships.filter(user=request.user, is_active=True).first()
    if not membership or not membership.is_admin:
        return Response(
            {'error': 'Only room admins can create invites'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generate invite
    invite = RoomInvite.objects.create(
        room=room,
        created_by=request.user,
        invite_code=f"{room.room_code}-{room.id.hex[:8]}"
    )
    
    serializer = RoomInviteSerializer(invite, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def room_by_code(request, room_code):
    """Get room info by code (for invite links)"""
    room = get_object_or_404(Room, room_code=room_code.upper(), is_active=True)
    serializer = RoomSerializer(room, context={'request': request})
    return Response(serializer.data)