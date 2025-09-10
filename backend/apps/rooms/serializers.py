from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room, RoomMembership, RoomInvite


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class RoomMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = RoomMembership
        fields = ['id', 'user', 'public_key', 'joined_at', 'is_admin', 'is_active']
        read_only_fields = ['id', 'joined_at', 'is_admin']


class RoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'room_code', 'created_by', 'created_at', 
            'updated_at', 'is_active', 'max_members', 'member_count',
            'is_member', 'is_creator'
        ]
        read_only_fields = ['id', 'room_code', 'created_by', 'created_at', 'updated_at']

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user, is_active=True).exists()
        return False

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.created_by == request.user
        return False


class RoomCreateSerializer(serializers.ModelSerializer):
    public_key = serializers.CharField(write_only=True)
    
    class Meta:
        model = Room
        fields = ['name', 'max_members', 'public_key']

    def create(self, validated_data):
        public_key = validated_data.pop('public_key')
        user = self.context['request'].user
        
        # Create room
        room = Room.objects.create(
            name=validated_data['name'],
            max_members=validated_data.get('max_members', 100),
            created_by=user
        )
        
        # Add creator as first member
        RoomMembership.objects.create(
            room=room,
            user=user,
            public_key=public_key,
            is_admin=True
        )
        
        return room


class JoinRoomSerializer(serializers.Serializer):
    room_code = serializers.CharField(max_length=10)
    public_key = serializers.CharField()
    
    def validate_room_code(self, value):
        try:
            room = Room.objects.get(room_code=value.upper(), is_active=True)
        except Room.DoesNotExist:
            raise serializers.ValidationError("Room not found or inactive")
        return value.upper()

    def save(self):
        room_code = self.validated_data['room_code']
        public_key = self.validated_data['public_key']
        user = self.context['request'].user
        
        room = Room.objects.get(room_code=room_code, is_active=True)
        
        # Check if already a member
        membership, created = RoomMembership.objects.get_or_create(
            room=room,
            user=user,
            defaults={
                'public_key': public_key,
                'is_active': True
            }
        )
        
        if not created and not membership.is_active:
            # Reactivate membership
            membership.public_key = public_key
            membership.is_active = True
            membership.save()
        
        return room


class RoomInviteSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    invite_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomInvite
        fields = [
            'id', 'room', 'created_by', 'invite_code', 'expires_at',
            'uses_remaining', 'created_at', 'invite_url', 'is_valid'
        ]
        read_only_fields = ['id', 'invite_code', 'created_at']

    def get_invite_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/join?code={obj.room.room_code}&name={obj.room.name}')
        return None