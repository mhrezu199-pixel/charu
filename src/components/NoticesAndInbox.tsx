/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Announcements Board & Notifications Inbox
 * Conforms to PRD §5.10 and App-Flow F13
 */

import React, { useState } from 'react';
import { Bell, Pin, Megaphone, CheckCircle2, Clock, Calendar, User } from 'lucide-react';
import { Locale, Notice, NotificationItem, Role } from '../types';
import { formatLocalizedDate } from '../data/translations';

interface NoticesAndInboxProps {
  notices: Notice[];
  notifications: NotificationItem[];
  locale: Locale;
  currentRole: Role;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NoticesAndInbox: React.FC<NoticesAndInboxProps> = ({
  notices,
  notifications,
  locale,
  currentRole,
  onMarkNotificationRead,
  onMarkAllRead,
}) => {
  const [tab, setTab] = useState<'notices' | 'inbox'>('notices');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setTab('notices')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'notices'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'নোটিশ বোর্ড' : 'Announcements'}</span>
          </button>

          <button
            onClick={() => setTab('inbox')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'inbox'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'ব্যক্তিগত ইনবক্স' : 'Personal Inbox'}</span>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EC1C24] text-white flex items-center justify-center text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'inbox' && unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#EC1C24] hover:underline"
          >
            {locale === 'bn' ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* TAB 1: NOTICES BOARD */}
      {tab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map(notice => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-3 cursor-pointer hover:border-[#EC1C24] transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#8C7B7C]">
                  {notice.publishAt}
                </span>
                {notice.pinned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE8E9] text-[#EC1C24] flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    <span>PINNED</span>
                  </span>
                )}
              </div>

              <h4 className="font-bold text-base text-[#2A1A1B] group-hover:text-[#EC1C24] transition">
                {locale === 'bn' ? notice.titleBn : notice.titleEn}
              </h4>

              <p className="text-xs text-[#8C7B7C] line-clamp-3">
                {locale === 'bn' ? notice.bodyBn : notice.bodyEn}
              </p>

              <div className="pt-2 border-t border-[#EDE4DC] flex items-center justify-between text-[11px] text-[#8C7B7C]">
                <span>By {notice.author}</span>
                <span className="text-[#EC1C24] font-semibold">
                  {locale === 'bn' ? 'সম্পূর্ণ পড়ুন →' : 'Read Full Notice →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INBOX */}
      {tab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-[#8C7B7C] text-xs">
              {locale === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications in inbox'}
            </div>
          ) : (
            notifications.map(ntf => (
              <div
                key={ntf.id}
                onClick={() => onMarkNotificationRead(ntf.id)}
                className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                  ntf.isRead
                    ? 'bg-[#FBF6F2]/60 border-[#EDE4DC] opacity-75'
                    : 'bg-[#FDE8E9]/30 border-[#EC1C24]/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      ntf.isRead ? 'bg-transparent' : 'bg-[#EC1C24] animate-ping'
                    }`}
                  />
                  <div>
                    <h5 className="font-bold text-xs text-[#2A1A1B]">
                      {locale === 'bn' ? ntf.titleBn : ntf.titleEn}
                    </h5>
                    <p className="text-xs text-[#8C7B7C] mt-0.5">
                      {locale === 'bn' ? ntf.bodyBn : ntf.bodyEn}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-[#8C7B7C] shrink-0">
                  {ntf.createdAt.split('T')[0]}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EDE4DC] shadow-2xl relative">
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-[#2A1A1B] flex items-center justify-center hover:bg-gray-200"
            >
              ✕
            </button>

            <span className="text-[10px] uppercase font-bold text-[#EC1C24] bg-[#FDE8E9] px-2.5 py-1 rounded-full">
              Official Announcement
            </span>

            <h3 className="text-lg font-bold text-[#2A1A1B] mt-3">
              {locale === 'bn' ? selectedNotice.titleBn : selectedNotice.titleEn}
            </h3>

            <div className="text-xs text-[#8C7B7C] my-2">
              Published: {selectedNotice.publishAt} · Author: {selectedNotice.author}
            </div>

            <div className="p-4 bg-[#FBF6F2] rounded-2xl border border-[#EDE4DC] text-xs text-[#2A1A1B] leading-relaxed my-4">
              {locale === 'bn' ? selectedNotice.bodyBn : selectedNotice.bodyEn}
            </div>

            <button
              onClick={() => setSelectedNotice(null)}
              className="w-full py-2.5 bg-[#EC1C24] text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
