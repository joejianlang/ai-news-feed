import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const newRules = `日程安排/节目表（如电视播放时间、直播安排）
活动预告/观赛指南/购票指南
周期性总结（如"本周回顾"、"今日要闻"、"每日简报"等汇总帖）
纯粹的广告或促销内容
天气预报、体育比分列表等纯信息罗列
频道介绍/平台介绍（如“关于我们”、“联系我们”、“官网介绍”等）
社交媒体二维码引导/关注引导/点赞订阅提醒
标题与内容均为宽泛的媒体品牌口号或介绍声明，无具体新闻事实的内容`;

async function updateFilterRules() {
    console.log('Checking ai_config for filter_rules...');

    const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .eq('config_key', 'filter_rules');

    if (error) {
        console.error('Error fetching config:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Updating existing filter_rules in database...');
        const { error: updateError } = await supabase
            .from('ai_config')
            .update({ config_value: newRules })
            .eq('config_key', 'filter_rules');

        if (updateError) {
            console.error('Error updating config:', updateError);
        } else {
            console.log('Successfully updated filter_rules in database.');
        }
    } else {
        console.log('filter_rules not found in database, creating it...');
        const { error: insertError } = await supabase
            .from('ai_config')
            .insert({ config_key: 'filter_rules', config_value: newRules });

        if (insertError) {
            console.error('Error inserting config:', insertError);
        } else {
            console.log('Successfully created filter_rules in database.');
        }
    }
}

updateFilterRules();
