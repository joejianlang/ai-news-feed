-- Initialize legal agreements in system_settings
INSERT INTO system_settings (key, value)
VALUES 
('agreement_registration', '{"title": "用户注册协议", "content": "请在这里输入用户注册协议内容..."}'),
('agreement_privacy', '{"title": "隐私政策/保密协议", "content": "请在这里输入隐私政策内容..."}'),
('agreement_ad_service', '{"title": "广告发布服务协议", "content": "请在这里输入广告发布服务协议内容..."}')
ON CONFLICT (key) DO NOTHING;
