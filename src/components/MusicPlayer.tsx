'use client';
import { useEffect, useState, useRef } from 'react';
import { Icon } from './Icons';
import type { MusicController } from '@/hooks/useMusicPlayer';
export function MusicPlayer({
  controller,
  onPanelChange,
}: {
  controller: MusicController;
  onPanelChange: (open: boolean) => void;
}) {
  const settings = useRef<HTMLButtonElement>(null);
  const closePanel = () => {
    setOpen(false);
    onPanelChange(false);
    requestAnimationFrame(() => settings.current?.focus());
  };
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  const { source, status, muted, volume } = controller;
  useEffect(() => () => onPanelChange(false), [onPanelChange]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(false), 3000);
    return () => clearTimeout(id);
  }, [notice]);
  const absent = !source;
  const retry = status === 'blocked' || status === 'error';
  return (
    <div className="music-control">
      <button
        className="sound-button"
        aria-label={absent ? '音乐尚未配置' : retry ? '重新播放音乐' : muted ? '开启音乐' : '静音'}
        onClick={() => {
          if (absent) {
            setNotice(true);
            return;
          }
          controller.toggleMute();
        }}
      >
        <Icon name={absent || muted || retry ? 'muted' : 'sound'} size={17} />
        <span>{absent || muted || retry ? 'SOUND OFF' : 'SOUND ON'}</span>
      </button>
      <button
        ref={settings}
        className="music-settings"
        aria-label="音乐设置"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          onPanelChange(!open);
        }}
      >
        <Icon name="settings" size={16} />
      </button>
      {notice && (
        <span className="sound-notice" role="status">
          尚未添加配乐，安静地看也很好。
        </span>
      )}
      {open && (
        <div
          className="music-panel"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              closePanel();
            }
          }}
        >
          <div>
            <span>背景音乐</span>
            <button
              className="icon-button"
              aria-label="关闭音乐设置"
              onClick={() => {
                closePanel();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <label>
            音量{' '}
            <input
              type="range"
              aria-label="音乐音量"
              min="0"
              max="1"
              step=".05"
              value={volume}
              onChange={(e) => controller.setVolume(Number(e.target.value))}
            />
            <output>{Math.round(volume * 100)}%</output>
          </label>
          <p>
            {absent
              ? '还没有添加配乐。'
              : status === 'error'
                ? '配乐加载失败，可重试或继续安静浏览。'
                : status === 'blocked'
                  ? '轻触重新播放，允许浏览器播放配乐。'
                  : muted
                    ? '音乐已静音。'
                    : '音量只影响背景音乐。'}
          </p>
          {retry && (
            <button className="text-button" onClick={controller.activate}>
              重新播放
              <Icon name="play" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
