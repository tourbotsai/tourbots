"use client";

import React, { FC } from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import { CustomisationPreset } from '@/lib/types/chatbot-customisation';
import { cn } from '@/lib/utils';
import PresetCard from '@/components/ui/preset-card';

interface PresetSelectorProps {
  currentCustomisation: ChatbotCustomisation;
  onPresetSelect: (preset: CustomisationPreset) => void;
  onPresetPreview?: (preset: CustomisationPreset) => void;
  className?: string;
  compactMode?: boolean;
  favouritePresets?: string[];
  onToggleFavourite?: (presetName: string) => void;
}

interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'minimal' | 'modern' | 'professional' | 'corporate' | 'playful';
  preview: {
    primary_colour: string;
    secondary_colour: string;
    text_colour: string;
    background_colour: string;
    border_radius: number;
    chat_button_animation: string;
    font_family: string;
  };
  config: {
    // Desktop dimensions - matching Body Active
    window_width: number;
    window_height: number;
    chat_window_width: number;
    chat_window_height: number;
    header_height: number;
    input_height: number;
    message_max_width: number;
    
    // Mobile dimensions - matching Body Active
    mobile_chat_window_width: number;
    mobile_chat_window_height: number;
    mobile_header_height: number;
    mobile_input_height: number;
    mobile_message_max_width: number;
    
    // Icon sizes - matching Body Active
    icon_size: number;
    header_icon_size: number;
    mobile_icon_size: number;
    mobile_header_icon_size: number;
    
    // Font sizes - matching Body Active
    header_text_size: number;
    message_text_size: number;
    placeholder_text_size: number;
    branding_text_size: number;
    mobile_header_text_size: number;
    mobile_message_text_size: number;
    mobile_placeholder_text_size: number;
    mobile_branding_text_size: number;
    
    // Font weights - matching Body Active
    message_font_weight: 'normal' | 'bold' | 'medium' | 'light';
    header_font_weight: 'normal' | 'bold' | 'medium' | 'light';
    mobile_message_font_weight: 'normal' | 'bold' | 'medium' | 'light';
    mobile_header_font_weight: 'normal' | 'bold' | 'medium' | 'light';
    
    // Border radius - constraint compliant
    chat_button_border_radius: number;
    chat_window_border_radius: number;
    message_border_radius: number;
    input_border_radius: number;
    send_button_border_radius: number;
    mobile_chat_button_border_radius: number;
    mobile_chat_window_border_radius: number;
    mobile_message_border_radius: number;
    mobile_input_border_radius: number;
    mobile_send_button_border_radius: number;
    
    // Offsets - matching Body Active
    chat_button_bottom_offset: number;
    chat_button_side_offset: number;
    mobile_chat_button_bottom_offset: number;
    mobile_chat_button_side_offset: number;
    chat_offset_bottom: number;
    chat_offset_side: number;
    mobile_chat_offset_bottom: number;
    mobile_chat_offset_side: number;
    
    // Colours
    chat_button_color: string;
    chat_button_hover_color: string;
    header_background_color: string;
    header_text_color: string;
    ai_message_background: string;
    ai_message_text_color: string;
    user_message_background: string;
    user_message_text_color: string;
    input_background_color: string;
    send_button_color: string;
    send_button_icon_color: string;
    send_button_hover_color: string;
    
    // Mobile colours
    mobile_chat_button_color: string;
    mobile_chat_button_hover_color: string;
    mobile_header_background_color: string;
    mobile_header_text_color: string;
    mobile_ai_message_background: string;
    mobile_ai_message_text_color: string;
    mobile_user_message_background: string;
    mobile_user_message_text_color: string;
    mobile_input_background_color: string;
    mobile_send_button_color: string;
    mobile_send_button_icon_color: string;
    mobile_send_button_hover_color: string;
    
    // Features - all Body Active fields
    chat_button_size: 'small' | 'medium' | 'large';
    chat_button_position: 'bottom-right' | 'bottom-left';
    chat_button_icon: string;
    chat_button_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
    chat_window_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
    message_shadow_enabled: boolean;
    chat_button_shadow: string;
    enable_animations: boolean;
    animation_speed: 'slow' | 'normal' | 'fast';
    chat_entrance_animation: 'none' | 'scale-up' | 'slide-up' | 'slide-down' | 'fade-in';
    message_animation: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
    button_hover_effect: 'scale' | 'glow' | 'lift' | 'none';
    chat_button_animation: 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
    animation_interval: number;
    idle_animation_enabled: boolean;
    idle_animation_type: 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
    idle_animation_interval: number;
    show_timestamps: boolean;
    timestamp_format: '12h' | '24h' | 'relative';
    show_user_avatar: boolean;
    show_bot_avatar: boolean;
    avatar_style: 'circle' | 'square' | 'rounded';
    bot_avatar_icon: 'Bot' | 'MessageCircle' | 'Headphones' | 'Users' | 'Crown' | 'Shield';
    user_avatar_icon: 'User' | 'UserCheck' | 'UserCog' | 'Smile' | 'Coffee';
    send_button_style: 'icon' | 'text' | 'icon-text';
    send_button_size: 'small' | 'medium' | 'large';
    send_button_icon: 'Send' | 'ArrowRight' | 'ChevronRight' | 'Play' | 'MessageCircle';
    font_family: string;
    show_powered_by: boolean;
    welcome_message_delay: number;
    
    // Mobile features
    mobile_chat_button_size: 'small' | 'medium' | 'large';
    mobile_chat_button_position: 'bottom-right' | 'bottom-left';
    mobile_chat_button_icon: 'MessageCircle' | 'Headphones' | 'Users' | 'Crown' | 'Shield';
    mobile_chat_button_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
    mobile_chat_window_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
    mobile_chat_button_shadow: boolean;
    mobile_chat_button_animation: 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
    mobile_button_hover_effect: 'scale' | 'glow' | 'lift' | 'none';
    mobile_fullscreen: boolean;
    mobile_font_family: string;
    mobile_show_user_avatar: boolean;
    mobile_show_bot_avatar: boolean;
    mobile_message_shadow_enabled: boolean;
    mobile_avatar_style: 'circle' | 'square' | 'rounded';
    mobile_bot_avatar_icon: 'Bot' | 'MessageCircle' | 'Headphones' | 'Users' | 'Crown' | 'Shield';
    mobile_user_avatar_icon: 'User' | 'UserCheck' | 'UserCog' | 'Smile' | 'Coffee';
    mobile_enable_animations: boolean;
    mobile_animation_speed: 'slow' | 'normal' | 'fast';
    mobile_chat_entrance_animation: 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
    mobile_message_animation: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
    mobile_animation_interval: number;
    mobile_idle_animation_enabled: boolean;
    mobile_idle_animation_type: 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
    mobile_idle_animation_interval: number;
    mobile_send_button_style: 'icon' | 'text' | 'icon-text';
    mobile_send_button_size: 'small' | 'medium' | 'large';
    mobile_send_button_icon: 'Send' | 'ArrowRight' | 'ChevronRight' | 'Play' | 'MessageCircle';
    mobile_show_powered_by: boolean;
    mobile_show_timestamps: boolean;
    mobile_timestamp_format: '12h' | '24h' | 'relative';
    mobile_welcome_message_delay: number;
  };
}

const presetTemplates: PresetTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design',
    thumbnail: '/branding/preset-minimal.jpg',
    category: 'minimal',
    preview: {
      primary_colour: '#6B7280',
      secondary_colour: '#F9FAFB',
      text_colour: '#1F2937',
      background_colour: '#F9FAFB',
      border_radius: 8,
      chat_button_animation: 'none',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    config: {
      // Desktop dimensions - matching Body Active
      window_width: 300,
      window_height: 400,
      chat_window_width: 400,
      chat_window_height: 600,
      header_height: 40,
      input_height: 36,
      message_max_width: 90,
      
      // Mobile dimensions - matching Body Active
      mobile_chat_window_width: 280,
      mobile_chat_window_height: 500,
      mobile_header_height: 40,
      mobile_input_height: 36,
      mobile_message_max_width: 95,
      
      // Icon sizes - matching Body Active
      icon_size: 48,
      header_icon_size: 30,
      mobile_icon_size: 42,
      mobile_header_icon_size: 28,
      
      // Font sizes - matching Body Active
      header_text_size: 14,
      message_text_size: 12,
      placeholder_text_size: 12,
      branding_text_size: 12,
      mobile_header_text_size: 14,
      mobile_message_text_size: 12,
      mobile_placeholder_text_size: 12,
      mobile_branding_text_size: 10,
      
      // Font weights - matching Body Active
      message_font_weight: 'normal',
      header_font_weight: 'bold',
      mobile_message_font_weight: 'normal',
      mobile_header_font_weight: 'bold',
      
      // Border radius - minimal style
      chat_button_border_radius: 8,
      chat_window_border_radius: 4,
      message_border_radius: 8,
      input_border_radius: 4,
      send_button_border_radius: 8,
      mobile_chat_button_border_radius: 8,
      mobile_chat_window_border_radius: 4,
      mobile_message_border_radius: 6,
      mobile_input_border_radius: 4,
      mobile_send_button_border_radius: 6,
      
      // Offsets - matching Body Active
      chat_button_bottom_offset: 20,
      chat_button_side_offset: 20,
      mobile_chat_button_bottom_offset: 15,
      mobile_chat_button_side_offset: 15,
      chat_offset_bottom: 20,
      chat_offset_side: 20,
      mobile_chat_offset_bottom: 15,
      mobile_chat_offset_side: 15,
      
      // Colours - minimal grey theme
      chat_button_color: '#6B7280',
      chat_button_hover_color: '#4B5563',
      header_background_color: '#F9FAFB',
      header_text_color: '#1F2937',
      ai_message_background: '#F3F4F6',
      ai_message_text_color: '#1F2937',
      user_message_background: '#6B7280',
      user_message_text_color: '#FFFFFF',
      input_background_color: '#FFFFFF',
      send_button_color: '#6B7280',
      send_button_icon_color: '#FFFFFF',
      send_button_hover_color: '#f0f0f0',
      
      // Mobile colours
      mobile_chat_button_color: '#6B7280',
      mobile_chat_button_hover_color: '#4B5563',
      mobile_header_background_color: '#F9FAFB',
      mobile_header_text_color: '#1F2937',
      mobile_ai_message_background: '#F3F4F6',
      mobile_ai_message_text_color: '#1F2937',
      mobile_user_message_background: '#6B7280',
      mobile_user_message_text_color: '#FFFFFF',
      mobile_input_background_color: '#FFFFFF',
      mobile_send_button_color: '#6B7280',
      mobile_send_button_icon_color: '#FFFFFF',
      mobile_send_button_hover_color: '#f0f0f0',
      
      // Features - all Body Active fields
      chat_button_size: 'medium',
      chat_button_position: 'bottom-right',
      chat_button_icon: 'MessageCircle',
      chat_button_shadow_intensity: 'light',
      chat_window_shadow_intensity: 'light',
      message_shadow_enabled: false,
      chat_button_shadow: 'light',
      enable_animations: true,
      animation_speed: 'normal',
      chat_entrance_animation: 'scale-up',
      message_animation: 'slide-in',
      button_hover_effect: 'scale',
      chat_button_animation: 'none',
      animation_interval: 5,
      idle_animation_enabled: true,
      idle_animation_type: 'pulse',
      idle_animation_interval: 3000,
      show_timestamps: false,
      timestamp_format: '12h',
      show_user_avatar: true,
      show_bot_avatar: true,
      avatar_style: 'circle',
      bot_avatar_icon: 'Bot',
      user_avatar_icon: 'User',
      send_button_style: 'icon',
      send_button_size: 'medium',
      send_button_icon: 'Send',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      show_powered_by: true,
      welcome_message_delay: 1000,
      
      // Mobile features
      mobile_chat_button_size: 'medium',
      mobile_chat_button_position: 'bottom-right',
      mobile_chat_button_icon: 'MessageCircle',
      mobile_chat_button_shadow_intensity: 'light',
      mobile_chat_window_shadow_intensity: 'light',
      mobile_chat_button_shadow: true,
      mobile_chat_button_animation: 'none',
      mobile_button_hover_effect: 'scale',
      mobile_fullscreen: false,
      mobile_font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mobile_show_user_avatar: true,
      mobile_show_bot_avatar: true,
      mobile_message_shadow_enabled: false,
      mobile_avatar_style: 'circle',
      mobile_bot_avatar_icon: 'Bot',
      mobile_user_avatar_icon: 'User',
      mobile_enable_animations: true,
      mobile_animation_speed: 'normal',
      mobile_chat_entrance_animation: 'slide-up',
      mobile_message_animation: 'slide-in',
      mobile_animation_interval: 5,
      mobile_idle_animation_enabled: true,
      mobile_idle_animation_type: 'pulse',
      mobile_idle_animation_interval: 3000,
      mobile_send_button_style: 'icon',
      mobile_send_button_size: 'medium',
      mobile_send_button_icon: 'Send',
      mobile_show_powered_by: true,
      mobile_show_timestamps: false,
      mobile_timestamp_format: '12h',
      mobile_welcome_message_delay: 1000
    }
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Energetic fitness-venue design',
    thumbnail: '/branding/preset-fitness.jpg',
    category: 'professional',
    preview: {
      primary_colour: '#EF4444',
      secondary_colour: '#FEF2F2',
      text_colour: '#7F1D1D',
      background_colour: '#FEF2F2',
      border_radius: 12,
      chat_button_animation: 'shake',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    config: {
      // Desktop dimensions - matching Body Active
      window_width: 300,
      window_height: 400,
      chat_window_width: 400,
      chat_window_height: 600,
      header_height: 40,
      input_height: 36,
      message_max_width: 90,
      
      // Mobile dimensions - matching Body Active
      mobile_chat_window_width: 280,
      mobile_chat_window_height: 500,
      mobile_header_height: 40,
      mobile_input_height: 36,
      mobile_message_max_width: 95,
      
      // Icon sizes - matching Body Active
      icon_size: 48,
      header_icon_size: 30,
      mobile_icon_size: 42,
      mobile_header_icon_size: 28,
      
      // Font sizes - matching Body Active
      header_text_size: 14,
      message_text_size: 12,
      placeholder_text_size: 12,
      branding_text_size: 12,
      mobile_header_text_size: 14,
      mobile_message_text_size: 12,
      mobile_placeholder_text_size: 12,
      mobile_branding_text_size: 10,
      
      // Font weights - matching Body Active
      message_font_weight: 'normal',
      header_font_weight: 'bold',
      mobile_message_font_weight: 'normal',
      mobile_header_font_weight: 'bold',
      
      // Border radius - fitness style (mixed radius)
      chat_button_border_radius: 12,
      chat_window_border_radius: 8,
      message_border_radius: 12,
      input_border_radius: 8,
      send_button_border_radius: 12,
      mobile_chat_button_border_radius: 12,
      mobile_chat_window_border_radius: 8,
      mobile_message_border_radius: 10,
      mobile_input_border_radius: 8,
      mobile_send_button_border_radius: 10,
      
      // Offsets - matching Body Active
      chat_button_bottom_offset: 20,
      chat_button_side_offset: 20,
      mobile_chat_button_bottom_offset: 15,
      mobile_chat_button_side_offset: 15,
      chat_offset_bottom: 20,
      chat_offset_side: 20,
      mobile_chat_offset_bottom: 15,
      mobile_chat_offset_side: 15,
      
      // Colours - energetic fitness theme
      chat_button_color: '#EF4444',
      chat_button_hover_color: '#DC2626',
      header_background_color: '#DC2626',
      header_text_color: '#FFFFFF',
      ai_message_background: '#FEF2F2',
      ai_message_text_color: '#7F1D1D',
      user_message_background: '#EF4444',
      user_message_text_color: '#FFFFFF',
      input_background_color: '#FFFFFF',
      send_button_color: '#EF4444',
      send_button_icon_color: '#FFFFFF',
      send_button_hover_color: '#f0f0f0',
      
      // Mobile colours
      mobile_chat_button_color: '#EF4444',
      mobile_chat_button_hover_color: '#DC2626',
      mobile_header_background_color: '#DC2626',
      mobile_header_text_color: '#FFFFFF',
      mobile_ai_message_background: '#FEF2F2',
      mobile_ai_message_text_color: '#7F1D1D',
      mobile_user_message_background: '#EF4444',
      mobile_user_message_text_color: '#FFFFFF',
      mobile_input_background_color: '#FFFFFF',
      mobile_send_button_color: '#EF4444',
      mobile_send_button_icon_color: '#FFFFFF',
      mobile_send_button_hover_color: '#f0f0f0',
      
      // Features - all Body Active fields
      chat_button_size: 'medium',
      chat_button_position: 'bottom-right',
      chat_button_icon: 'MessageCircle',
      chat_button_shadow_intensity: 'heavy',
      chat_window_shadow_intensity: 'heavy',
      message_shadow_enabled: false,
      chat_button_shadow: 'heavy',
      enable_animations: true,
      animation_speed: 'normal',
      chat_entrance_animation: 'scale-up',
      message_animation: 'slide-in',
      button_hover_effect: 'scale',
      chat_button_animation: 'shake',
      animation_interval: 5000,
      idle_animation_enabled: true,
      idle_animation_type: 'shake',
      idle_animation_interval: 5000,
      show_timestamps: false,
      timestamp_format: '12h',
      show_user_avatar: true,
      show_bot_avatar: true,
      avatar_style: 'circle',
      bot_avatar_icon: 'Bot',
      user_avatar_icon: 'User',
      send_button_style: 'icon',
      send_button_size: 'medium',
      send_button_icon: 'Send',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      show_powered_by: true,
      welcome_message_delay: 1000,
      
      // Mobile features
      mobile_chat_button_size: 'medium',
      mobile_chat_button_position: 'bottom-right',
      mobile_chat_button_icon: 'MessageCircle',
      mobile_chat_button_shadow_intensity: 'heavy',
      mobile_chat_window_shadow_intensity: 'heavy',
      mobile_chat_button_shadow: true,
      mobile_chat_button_animation: 'shake',
      mobile_button_hover_effect: 'scale',
      mobile_fullscreen: false,
      mobile_font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mobile_show_user_avatar: true,
      mobile_show_bot_avatar: true,
      mobile_message_shadow_enabled: false,
      mobile_avatar_style: 'circle',
      mobile_bot_avatar_icon: 'Bot',
      mobile_user_avatar_icon: 'User',
      mobile_enable_animations: true,
      mobile_animation_speed: 'normal',
      mobile_chat_entrance_animation: 'slide-up',
      mobile_message_animation: 'slide-in',
      mobile_animation_interval: 5000,
      mobile_idle_animation_enabled: true,
      mobile_idle_animation_type: 'shake',
      mobile_idle_animation_interval: 5000,
      mobile_send_button_style: 'icon',
      mobile_send_button_size: 'medium',
      mobile_send_button_icon: 'Send',
      mobile_show_powered_by: true,
      mobile_show_timestamps: false,
      mobile_timestamp_format: '12h',
      mobile_welcome_message_delay: 1000
    }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business-ready',
    thumbnail: '/branding/preset-corporate.jpg',
    category: 'corporate',
    preview: {
      primary_colour: '#1F2937',
      secondary_colour: '#F9FAFB',
      text_colour: '#1F2937',
      background_colour: '#F9FAFB',
      border_radius: 4,
      chat_button_animation: 'bounce',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    config: {
      // Desktop dimensions - matching Body Active
      window_width: 300,
      window_height: 400,
      chat_window_width: 400,
      chat_window_height: 600,
      header_height: 40,
      input_height: 36,
      message_max_width: 90,
      
      // Mobile dimensions - matching Body Active
      mobile_chat_window_width: 280,
      mobile_chat_window_height: 500,
      mobile_header_height: 40,
      mobile_input_height: 36,
      mobile_message_max_width: 95,
      
      // Icon sizes - matching Body Active
      icon_size: 48,
      header_icon_size: 30,
      mobile_icon_size: 42,
      mobile_header_icon_size: 28,
      
      // Font sizes - matching Body Active
      header_text_size: 14,
      message_text_size: 12,
      placeholder_text_size: 12,
      branding_text_size: 12,
      mobile_header_text_size: 14,
      mobile_message_text_size: 12,
      mobile_placeholder_text_size: 12,
      mobile_branding_text_size: 10,
      
      // Font weights - matching Body Active
      message_font_weight: 'normal',
      header_font_weight: 'bold',
      mobile_message_font_weight: 'normal',
      mobile_header_font_weight: 'bold',
      
      // Border radius - corporate style (minimal radius)
      chat_button_border_radius: 4,
      chat_window_border_radius: 0,
      message_border_radius: 4,
      input_border_radius: 0,
      send_button_border_radius: 4,
      mobile_chat_button_border_radius: 4,
      mobile_chat_window_border_radius: 0,
      mobile_message_border_radius: 4,
      mobile_input_border_radius: 0,
      mobile_send_button_border_radius: 4,
      
      // Offsets - matching Body Active
      chat_button_bottom_offset: 20,
      chat_button_side_offset: 20,
      mobile_chat_button_bottom_offset: 15,
      mobile_chat_button_side_offset: 15,
      chat_offset_bottom: 20,
      chat_offset_side: 20,
      mobile_chat_offset_bottom: 15,
      mobile_chat_offset_side: 15,
      
      // Colours - professional corporate theme
      chat_button_color: '#1F2937',
      chat_button_hover_color: '#111827',
      header_background_color: '#374151',
      header_text_color: '#FFFFFF',
      ai_message_background: '#F9FAFB',
      ai_message_text_color: '#1F2937',
      user_message_background: '#1F2937',
      user_message_text_color: '#FFFFFF',
      input_background_color: '#FFFFFF',
      send_button_color: '#1F2937',
      send_button_icon_color: '#FFFFFF',
      send_button_hover_color: '#f0f0f0',
      
      // Mobile colours
      mobile_chat_button_color: '#1F2937',
      mobile_chat_button_hover_color: '#111827',
      mobile_header_background_color: '#374151',
      mobile_header_text_color: '#FFFFFF',
      mobile_ai_message_background: '#F9FAFB',
      mobile_ai_message_text_color: '#1F2937',
      mobile_user_message_background: '#1F2937',
      mobile_user_message_text_color: '#FFFFFF',
      mobile_input_background_color: '#FFFFFF',
      mobile_send_button_color: '#1F2937',
      mobile_send_button_icon_color: '#FFFFFF',
      mobile_send_button_hover_color: '#f0f0f0',
      
      // Features - all Body Active fields
      chat_button_size: 'medium',
      chat_button_position: 'bottom-right',
      chat_button_icon: 'MessageCircle',
      chat_button_shadow_intensity: 'light',
      chat_window_shadow_intensity: 'light',
      message_shadow_enabled: false,
      chat_button_shadow: 'light',
      enable_animations: false,
      animation_speed: 'normal',
      chat_entrance_animation: 'scale-up',
      message_animation: 'slide-in',
      button_hover_effect: 'scale',
      chat_button_animation: 'bounce',
      animation_interval: 5000,
      idle_animation_enabled: true,
      idle_animation_type: 'bounce',
      idle_animation_interval: 5000,
      show_timestamps: false,
      timestamp_format: '12h',
      show_user_avatar: true,
      show_bot_avatar: true,
      avatar_style: 'circle',
      bot_avatar_icon: 'Bot',
      user_avatar_icon: 'User',
      send_button_style: 'icon',
      send_button_size: 'medium',
      send_button_icon: 'Send',
      font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      show_powered_by: true,
      welcome_message_delay: 1000,
      
      // Mobile features
      mobile_chat_button_size: 'medium',
      mobile_chat_button_position: 'bottom-right',
      mobile_chat_button_icon: 'MessageCircle',
      mobile_chat_button_shadow_intensity: 'light',
      mobile_chat_window_shadow_intensity: 'light',
      mobile_chat_button_shadow: true,
      mobile_chat_button_animation: 'bounce',
      mobile_button_hover_effect: 'scale',
      mobile_fullscreen: false,
      mobile_font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mobile_show_user_avatar: true,
      mobile_show_bot_avatar: true,
      mobile_message_shadow_enabled: false,
      mobile_avatar_style: 'circle',
      mobile_bot_avatar_icon: 'Bot',
      mobile_user_avatar_icon: 'User',
      mobile_enable_animations: false,
      mobile_animation_speed: 'normal',
      mobile_chat_entrance_animation: 'slide-up',
      mobile_message_animation: 'slide-in',
      mobile_animation_interval: 5000,
      mobile_idle_animation_enabled: true,
      mobile_idle_animation_type: 'bounce',
      mobile_idle_animation_interval: 5000,
      mobile_send_button_style: 'icon',
      mobile_send_button_size: 'medium',
      mobile_send_button_icon: 'Send',
      mobile_show_powered_by: true,
      mobile_show_timestamps: false,
      mobile_timestamp_format: '12h',
      mobile_welcome_message_delay: 1000
    }
  }
];

const PresetSelector: FC<PresetSelectorProps> = ({
  currentCustomisation,
  onPresetSelect,
  onPresetPreview,
  className,
  compactMode = false,
  favouritePresets = [],
  onToggleFavourite
}) => {
  const handlePresetSelect = (presetId: string) => {
    const preset = presetTemplates.find(p => p.id === presetId);
    if (preset && onPresetSelect) {
      const customisationPreset: CustomisationPreset = {
        name: preset.name,
        description: preset.description,
        category: preset.category,
        tags: [],
        customisation: preset.config
      };
      onPresetSelect(customisationPreset);
    }
  };

  const handlePresetPreview = (presetId: string) => {
    const preset = presetTemplates.find(p => p.id === presetId);
    if (preset && onPresetPreview) {
      const customisationPreset: CustomisationPreset = {
        name: preset.name,
        description: preset.description,
        category: preset.category,
        tags: [],
        customisation: preset.config
      };
      onPresetPreview(customisationPreset);
    }
  };

  const handleToggleFavourite = (presetId: string) => {
    const preset = presetTemplates.find(p => p.id === presetId);
    if (preset && onToggleFavourite) {
      onToggleFavourite(preset.name);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presetTemplates.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={{
              ...preset,
              config: {
                chat_button_animation: preset.config.chat_button_animation,
                idle_animation_enabled: preset.config.idle_animation_enabled,
                idle_animation_type: preset.config.idle_animation_type,
                idle_animation_interval: preset.config.idle_animation_interval,
                animation_speed: preset.config.animation_speed,
                enable_animations: preset.config.enable_animations
              }
            }}
            isSelected={false}
            isFavorite={favouritePresets.includes(preset.name)}
            onSelect={handlePresetSelect}
            onPreview={handlePresetPreview}
            onFavorite={handleToggleFavourite}
            size={compactMode ? 'small' : 'medium'}
            showActions={true}
            showPreview={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PresetSelector; 