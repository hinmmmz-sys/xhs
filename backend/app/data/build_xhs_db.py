"""构建小红书本地搜索数据库 - 从采集的搜索结果生成JSON文件"""

import json
import os
import re
from pathlib import Path

# 所有采集的搜索结果数据（按关键词分组）
SCRAPE_DATA = {
    "外劳招聘": [
        {"id": "69eae37e0000000019025c01", "title": "内地人怎么申请去香港工作", "author": "申請勞工配額  翼天禧", "likes": "6", "url": "https://www.xiaohongshu.com/explore/69eae37e0000000019025c01?xsec_token=ABBTcGOZE1zpHnSQ_Rw7wXayPQV1ed5XuG2D39iA0zdgw=&xsec_source="},
        {"id": "6a478741000000001c024070", "title": "新港漂落脚第一步：靠外卖、快递零工过渡", "author": "深圳微时光", "likes": "10", "url": "https://www.xiaohongshu.com/explore/6a478741000000001c024070?xsec_token=ABi1qPtkCGX_e8Jn43be_zIhiE6dcRLyWwP0FoSEC-9tA=&xsec_source="},
        {"id": "69ce7228000000002200eed3", "title": "香港雇主申请外劳配额", "author": "申請勞工配額  翼天禧", "likes": "7", "url": "https://www.xiaohongshu.com/explore/69ce7228000000002200eed3?xsec_token=ABmdvPHvLQxPeB9U4F-AV1kdPfRHkE1qeD-t7HWTL_9Lw=&xsec_source="},
        {"id": "6a33703e000000000e038400", "title": "澳洲屠户年薪70万，打工人看完不淡定了", "author": "澳财经", "likes": "5", "url": "https://www.xiaohongshu.com/explore/6a33703e000000000e038400?xsec_token=ABvaxP3JE_fxcacutrotfO_DytPuKB8dE728m82zbM3wI=&xsec_source="},
        {"id": "6a4244870000000017029ec5", "title": "香港外劳招聘最新信息", "author": "1008的喜洋洋", "likes": "292", "url": "https://www.xiaohongshu.com/explore/6a4244870000000017029ec5?xsec_token=ABRKT9nByy54VYgZbBSBoU2veo-ynoDvBawSO6LHgYJuI=&xsec_source="},
        {"id": "69f17ed00000000022029575", "title": "🇭🇰外劳保安来了！态度好过本地人？", "author": "港漂有话说", "likes": "75", "url": "https://www.xiaohongshu.com/explore/69f17ed00000000022029575?xsec_token=ABwlMS_LV8koElCUSRRBXOF32ua26f_Wq-1VvBxTERmgI=&xsec_source="},
        {"id": "69b2e0110000000026030698", "title": "会日语的过来", "author": "时间旅行者", "likes": "19", "url": "https://www.xiaohongshu.com/explore/69b2e0110000000026030698?xsec_token=ABwwsukEErpl9HtMVm3DIyChl-5_HDAVkvcgoYFz6Vq3A=&xsec_source="},
        {"id": "699e56f2000000001d025345", "title": "最有效的找工作途径：外派，外企，远程等", "author": "John环球工作", "likes": "39", "url": "https://www.xiaohongshu.com/explore/699e56f2000000001d025345?xsec_token=ABxZCaUNM4M43yOjN1n6UN8V_yz-Q6cVKXd_fUV7I5JFs=&xsec_source="},
        {"id": "6a068a6d0000000037034506", "title": "香港工作生活分享", "author": "刘帅领聊升学", "likes": "4", "url": "https://www.xiaohongshu.com/explore/6a068a6d0000000037034506?xsec_token=AB3lcszIHNjK2N9zyrBiIBk08M5FDgDCa1GIhx5nLjHHw=&xsec_source="},
        {"id": "69ff185f000000003701c93a", "title": "这么好的机会来试一试吧～", "author": "南溪学姐（未名新港）", "likes": "17", "url": "https://www.xiaohongshu.com/explore/69ff185f000000003701c93a?xsec_token=ABcNtCnHIuLnsU3pxGdJ58oDaJDkvChd2qQYfVnQp4txE=&xsec_source="},
        {"id": "6a04409b0000000007011469", "title": "Apple Store零售店2026繁忙季招聘开启", "author": "耳東佳", "likes": "852", "url": "https://www.xiaohongshu.com/explore/6a04409b0000000007011469?xsec_token=ABaqskpDPx3Pfti_Vg3z2UntcBfk8rV0b0PK-4oRiMhUM=&xsec_source="},
        {"id": "69ff17c6000000003700e336", "title": "这里有个offer待查收～", "author": "南溪学姐（未名新港）", "likes": "36", "url": "https://www.xiaohongshu.com/explore/69ff17c6000000003700e336?xsec_token=ABcNtCnHIuLnsU3pxGdJ58oIXGuuvsPmY1RBS9s-vn9rk=&xsec_source="},
        {"id": "6a47a29c000000001102f4d0", "title": "广州广播电视台招聘", "author": "广州广播电视台", "likes": "5", "url": "https://www.xiaohongshu.com/explore/6a47a29c000000001102f4d0?xsec_token=ABi1qPtkCGX_e8Jn43be_zIr3JvdP1nys7nXyMX_DMiXs=&xsec_source="},
        {"id": "6a486fbf000000002200815c", "title": "中东工作求职贴，hr看过来", "author": "江夏小柴胡Natsu", "likes": "8", "url": "https://www.xiaohongshu.com/explore/6a486fbf000000002200815c?xsec_token=ABFT7rOyJOKnIiqEJWNIR8fs9c2WnktcBAdD4n54ibvDY=&xsec_source="},
        {"id": "6a4b193e0000000016025f66", "title": "高考低于600分需说明哪科丢的分", "author": "工小豹", "likes": "347", "url": "https://www.xiaohongshu.com/explore/6a4b193e0000000016025f66?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGFX0hFc07B-B4-Q8LyW4oX4=&xsec_source="},
        {"id": "69c8f04d000000001b0026c4", "title": "免费出国打工的，四个途径！", "author": "小金说出国", "likes": "38", "url": "https://www.xiaohongshu.com/explore/69c8f04d000000001b0026c4?xsec_token=ABny9kX6jEPb2m7jjXeNkvjJVlZrSpZndf87LdueMA2Jk=&xsec_source="},
        {"id": "6a47d4280000000011019f38", "title": "外劳招聘信息汇总", "author": "财商华老师", "likes": "184", "url": "https://www.xiaohongshu.com/explore/6a47d4280000000011019f38?xsec_token=ABi1qPtkCGX_e8Jn43be_zIkF7-aohPYbUzJWHpTJeUKk=&xsec_source="},
        {"id": "6a33ef35000000001c026882", "title": "外派转正月薪6k，刷新了最低外派薪资记录", "author": "驻外百晓生", "likes": "119", "url": "https://www.xiaohongshu.com/explore/6a33ef35000000001c026882?xsec_token=ABvaxP3JE_fxcacutrotfO_IS-0sR7YyGiU91SHbUE-cc=&xsec_source="},
    ],
    "跨境电商": [
        {"id": "68c9036f000000000e00d275", "title": "一个人做跨境电商做Tiktok", "author": "老方小号", "likes": "9810", "url": "https://www.xiaohongshu.com/explore/68c9036f000000000e00d275?xsec_token=ABrYQHxKlmhi4xnj6qi_w6IEUvTz7ke5P-Yv_U2H7iOs4=&xsec_source="},
        {"id": "6970bbc0000000000d00bcca", "title": "第一周，终于出第一单了 新手真的别想复杂", "author": "菜菜做ozon", "likes": "1147", "url": "https://www.xiaohongshu.com/explore/6970bbc0000000000d00bcca?xsec_token=AByN_iEFqpuaNE3kWdxk8awB2Bp-CkHp-XlR0DjPmZcRY=&xsec_source="},
        {"id": "69083583000000000300d719", "title": "奔四了做了两年跨境电商，建议不要想太多", "author": "阿洋闹海", "likes": "587", "url": "https://www.xiaohongshu.com/explore/69083583000000000300d719?xsec_token=ABZyfyTR9Aaj1EzoT0JH1mf1XZPmvqy9BTcYxxSnJNiz4=&xsec_source="},
        {"id": "68ce5539000000001201fc01", "title": "TK跨境半年，关店了", "author": "TK迷糊闯", "likes": "1164", "url": "https://www.xiaohongshu.com/explore/68ce5539000000001201fc01?xsec_token=ABmEaIhcDlRvGUU03LqBIhmjG9wJnIkdwrbkUwZrGUf9Q=&xsec_source="},
        {"id": "6a13b8980000000007021eee", "title": "用 Codex 做跨境调研，真的有点离谱。", "author": "稳卖选手Wendy", "likes": "2273", "url": "https://www.xiaohongshu.com/explore/6a13b8980000000007021eee?xsec_token=ABkt4t-LyZo8p4FXoT2nwITBR8v8WWCcgEL8WB0a1M04Q=&xsec_source="},
        {"id": "6a24de94000000003502f935", "title": "说实话很难听，但这就是跨境电商的真实现状", "author": "加站日子", "likes": "126", "url": "https://www.xiaohongshu.com/explore/6a24de94000000003502f935?xsec_token=ABxh4pK8Lfn7xCFggxisVpggp33_4eD_7BXvpgB2SSLSQ=&xsec_source="},
        {"id": "6a267cb7000000001702bd79", "title": "想听真话，现在跨境电商好做嘛….", "author": "不发脾气只发财", "likes": "525", "url": "https://www.xiaohongshu.com/explore/6a267cb7000000001702bd79?xsec_token=AB084LSOgk0dVub-9xeYOwFEjcTp9lyDj_cV7eTojEnDI=&xsec_source="},
        {"id": "66d9f5d8000000001e01b46a", "title": "00后创业半年200万｜跨境电商如何从0到1", "author": "Kefan日记", "likes": "4.4万", "url": "https://www.xiaohongshu.com/explore/66d9f5d8000000001e01b46a?xsec_token=AB0-gLW9mMBxYvbEBWbZ1u3f5v4AOXBt1_7xcPS2PV_zA=&xsec_source="},
        {"id": "6a310087000000000800350d", "title": "跨境创业 1 个月真实复盘", "author": "阿琳的亚马逊创业日记", "likes": "50", "url": "https://www.xiaohongshu.com/explore/6a310087000000000800350d?xsec_token=AB08QFW47sP0OXaxzCrCfq6Jjfj-7M3jNFmuEWGwvFtrA=&xsec_source="},
        {"id": "6a3931f80000000007024e3a", "title": "跨境全解析！新手必看", "author": "小红帽kj", "likes": "155", "url": "https://www.xiaohongshu.com/explore/6a3931f80000000007024e3a?xsec_token=AB6jKOnNOGaw_93bOXVckcqrNA_GGJu_so1uqvGYvoplA=&xsec_source="},
        {"id": "6858112a00000000120328f1", "title": "跨境电商实操分享", "author": "Jack要充电", "likes": "4731", "url": "https://www.xiaohongshu.com/explore/6858112a00000000120328f1?xsec_token=AB6_AsdGTIkk5N2Np8BwbFD9BwUjVFFzg01H_kFVmZ0_E=&xsec_source="},
        {"id": "69fc93a5000000001f004132", "title": "亚马逊新手必学的22个名词（说人话）", "author": "跨境天哥", "likes": "696", "url": "https://www.xiaohongshu.com/explore/69fc93a5000000001f004132?xsec_token=AB1lxSolcJO8oP34vMXSMEH3XRTenj2K-hZ_LXQd2npGo=&xsec_source="},
        {"id": "67e7f439000000001c007744", "title": "为什么身边没人做跨境电商", "author": "南京老A", "likes": "795", "url": "https://www.xiaohongshu.com/explore/67e7f439000000001c007744?xsec_token=ABqXHxsYvkByeKttGcQGdW6xBZ4Tl6oqpvlXujg9yUyMQ=&xsec_source="},
        {"id": "6a13a7d1000000003701db9d", "title": "跨境！狗都不做，普通人千万不要进。", "author": "邻厨早餐到家", "likes": "14", "url": "https://www.xiaohongshu.com/explore/6a13a7d1000000003701db9d?xsec_token=ABkt4t-LyZo8p4FXoT2nwITLobBvXr0Vqe9oupljfTsSc=&xsec_source="},
        {"id": "682beca2000000002301d331", "title": "我一个人把跨境电商做成功了！", "author": "不坐船", "likes": "568", "url": "https://www.xiaohongshu.com/explore/682beca2000000002301d331?xsec_token=ABMeK6fecTHCdBm08CIc6jJ8PxfSgKjwYIPHAMp3MxumM=&xsec_source="},
    ],
    "香港工作": [
        {"id": "69df599700000000230146db", "title": "分享一些hk找工作的真实现状和看法吧", "author": "爆老师（bao sir）", "likes": "211", "url": "https://www.xiaohongshu.com/explore/69df599700000000230146db?xsec_token=AB-mrp-PQJEQHanDZByHxBNBLFw7OYUo8PRfg2Lfhlum0=&xsec_source="},
        {"id": "68923034000000002203953a", "title": "香港06年保安，又做保安的一天", "author": "Ming", "likes": "366", "url": "https://www.xiaohongshu.com/explore/68923034000000002203953a?xsec_token=ABQVCpqSsER7p4EJbXt4DLu7eT-qo8ZrTaCUayTjCaMCQ=&xsec_source="},
        {"id": "69eca972000000003502c2df", "title": "花2万多来香港打工，真的值吗？", "author": "Sandy姐", "likes": "92", "url": "https://www.xiaohongshu.com/explore/69eca972000000003502c2df?xsec_token=ABmGEDjKg7BeZ3wlxLghehbYb_RxHcmte66NHyf-zkR54=&xsec_source="},
        {"id": "689630ea0000000023026228", "title": "粤语很菜 两个月在香港找到工作（总结版", "author": "少甜芙芙", "likes": "337", "url": "https://www.xiaohongshu.com/explore/689630ea0000000023026228?xsec_token=AB97zSr5ab6RjbLFVYca9JfESxNBRZD7u80_lLrubXkGo=&xsec_source="},
        {"id": "68fa3a29000000000300f4e6", "title": "在hk工作过就别想回内地上班了", "author": "Nabieeee", "likes": "2657", "url": "https://www.xiaohongshu.com/explore/68fa3a29000000000300f4e6?xsec_token=ABDN-4TlNgPQyuDL-vwE--UPFYL8ciET_epLSYwPnI2Ek=&xsec_source="},
        {"id": "6a44c454000000000f031843", "title": "普通人去香港打工 还是要慎重吧！", "author": "就业推荐官", "likes": "6", "url": "https://www.xiaohongshu.com/explore/6a44c454000000000f031843?xsec_token=ABFG0NLY3kex_WWkcqL_XDGjMj7AgED_DF1VawzELfBHY=&xsec_source="},
        {"id": "6a3cb8c10000000007025e3e", "title": "香港工作生活记录", "author": "冰冰", "likes": "13", "url": "https://www.xiaohongshu.com/explore/6a3cb8c10000000007025e3e?xsec_token=AB3cKP4Tgil7Ghy8Vx3FTgyiTnYGIuLh0-Kwv19owCzOA=&xsec_source="},
        {"id": "6a33c4840000000015027779", "title": "外企实习｜香港揾工渠道整理&投递攻略", "author": "一只南木君", "likes": "322", "url": "https://www.xiaohongshu.com/explore/6a33c4840000000015027779?xsec_token=ABvaxP3JE_fxcacutrotfO_GxyYv9YdaCdxe6U_EgJNuM=&xsec_source="},
        {"id": "66b37457000000001e01b33a", "title": "实习月薪1w+｜揾工经验+渠道分享", "author": "小红薯69946B45", "likes": "1484", "url": "https://www.xiaohongshu.com/explore/66b37457000000001e01b33a?xsec_token=ABWMlyeIx8M5H_oZK643CLLxjv6B_HVtJPLFh94EHwUqM=&xsec_source="},
        {"id": "6a477f430000000007027a46", "title": "汇丰银行捞暑期实习生，1300HKD/天", "author": "一颗油橄榄", "likes": "5", "url": "https://www.xiaohongshu.com/explore/6a477f430000000007027a46?xsec_token=ABi1qPtkCGX_e8Jn43be_zIpXaF-GlTgxZxykZgxfat8E=&xsec_source="},
        {"id": "6a033f5f0000000035025aa2", "title": "香港IT这行 一些真实数字", "author": "Fang|HK打工", "likes": "274", "url": "https://www.xiaohongshu.com/explore/6a033f5f0000000035025aa2?xsec_token=AB0zRcm-7uSqpLBeN3wWUo9doHNAV4sFHStPRsDzWIcRE=&xsec_source="},
        {"id": "6a0ff559000000000603050a", "title": "香港Citi朋友组非常缺人，salary很香～", "author": "赏花分子", "likes": "33", "url": "https://www.xiaohongshu.com/explore/6a0ff559000000000603050a?xsec_token=ABD8ZtDL18rr2zkoxgcrfG-GnzWS4MzJ0ai09clacekfo=&xsec_source="},
        {"id": "69fbe7f9000000003700e2db", "title": "水灵灵的入职西九龙", "author": "之欧学姐（港漂Pro版）", "likes": "350", "url": "https://www.xiaohongshu.com/explore/69fbe7f9000000003700e2db?xsec_token=ABCfxMQsSTTJYyVK304N5Ldv4UX2LR3CLgKP3FM4cSC9Y=&xsec_source="},
        {"id": "6a2b824f000000003501d73c", "title": "放心吧，HKU是不会让你找不到工作的！", "author": "脆脆鲨（认真找工版）", "likes": "221", "url": "https://www.xiaohongshu.com/explore/6a2b824f000000003501d73c?xsec_token=AB3BTV0LVHB59-fWC8yhYuDvw6X627fcDWwexAxRa-3qw=&xsec_source="},
        {"id": "6a4761b60000000016026d7c", "title": "HK汇丰银行捞暑期实习生，可远程欢迎加入", "author": "旺旺不仙贝", "likes": "4", "url": "https://www.xiaohongshu.com/explore/6a4761b60000000016026d7c?xsec_token=ABi1qPtkCGX_e8Jn43be_zIgHB7ZfkYOtQTcb8XN4oiWo=&xsec_source="},
        {"id": "69f06994000000003701e888", "title": "PCCW-HKT：Hiring now！接受小白", "author": "Faye爱分享", "likes": "7", "url": "https://www.xiaohongshu.com/explore/69f06994000000003701e888?xsec_token=ABfO9yUIdpUrt76cax0Ugrg9amrkuwuk543udlucqVP6E=&xsec_source="},
        {"id": "699fd78e0000000022033d9c", "title": "香港打工人深港通勤2年多一些肺腑之言", "author": "带羊腿", "likes": "260", "url": "https://www.xiaohongshu.com/explore/699fd78e0000000022033d9c?xsec_token=ABnlOpLRGVefyJ4fQQyU-KuDSnfjzCgiw3WF-bcgupTHk=&xsec_source="},
        {"id": "69faf4d90000000023004af2", "title": "真的有人能在jobsdb和领英上找到工作么", "author": "凯撒今晚喝柠茶", "likes": "848", "url": "https://www.xiaohongshu.com/explore/69faf4d90000000023004af2?xsec_token=ABt9eG5C5hShc63S3rPOdN7i0e9AcXgj9epbSXSL4nQes=&xsec_source="},
    ],
    "海外求职": [
        {"id": "6a2a227a00000000060352af", "title": "base香港，有愿意来的吗，43000/月", "author": "赏花分子", "likes": "24", "url": "https://www.xiaohongshu.com/explore/6a2a227a00000000060352af?xsec_token=ABxatAShOusy7gaxfIYb9lMsu8BDgUHeRJtcpDEwg_524=&xsec_source="},
        {"id": "68d9eef9000000001301902c", "title": "港硕半年上岸4个大厂offer的邪修心得", "author": "超努力又爱干饭的Jerry", "likes": "270", "url": "https://www.xiaohongshu.com/explore/68d9eef9000000001301902c?xsec_token=ABhm65qyB6x07U9tNYdSpEYPnq6pRoO0c0q7pdwfqtO_w=&xsec_source="},
        {"id": "6802291a000000001d0039c2", "title": "前几天面完3个海归孩子，心里挺不是滋味的", "author": "流云", "likes": "4188", "url": "https://www.xiaohongshu.com/explore/6802291a000000001d0039c2?xsec_token=ABrIZN1YDlmbhV7UkIkLUcQqBbYj4cMc7xoV-GppNRBX0=&xsec_source="},
        {"id": "69e732550000000023007f4d", "title": "游戏公司 Rito Games有人来吗？ 接受0经验", "author": "Louise学姐", "likes": "134", "url": "https://www.xiaohongshu.com/explore/69e732550000000023007f4d?xsec_token=ABFsPMssa-cN8XnZOIDej3h_qx1Jc7YzMV9bC3c8sUqzQ=&xsec_source="},
        {"id": "6963d503000000000a03f7bf", "title": "海外求职篇(一)", "author": "我黑切呢？!", "likes": "47", "url": "https://www.xiaohongshu.com/explore/6963d503000000000a03f7bf?xsec_token=ABtjjwci_JRO3BSXAhUt8yWLKHn-BSrFkJSCbkNaAVfKY=&xsec_source="},
        {"id": "694f9817000000001e00b07d", "title": "Microsoft面试官：我见过最漂亮的简历", "author": "Leo的Quant Notes", "likes": "177", "url": "https://www.xiaohongshu.com/explore/694f9817000000001e00b07d?xsec_token=ABVNSYiMREp6uoe06zDWbCSfa19vn4djAm78DwBN24_QA=&xsec_source="},
        {"id": "6a059e0600000000350268b4", "title": "放心吧，CityU不会让你找不到工作的！", "author": "momo学姐海归校招版", "likes": "306", "url": "https://www.xiaohongshu.com/explore/6a059e0600000000350268b4?xsec_token=ABUBUn-Dh5xmXI3xCT6yg7A6K07nD7_-LKlpo57siqI_Y=&xsec_source="},
        {"id": "6a4b973a0000000021020db5", "title": "base香港，Financial Analyst 26500/月", "author": "Olivia（上岸版）", "likes": "5", "url": "https://www.xiaohongshu.com/explore/6a4b973a0000000021020db5?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGAsdQcD3D-EqV7TOXRhkF48=&xsec_source="},
        {"id": "697ae4a1000000000e03c5c1", "title": "大疆海外事业部真的很偏爱留学生（可ref", "author": "IntelliLink", "likes": "365", "url": "https://www.xiaohongshu.com/explore/697ae4a1000000000e03c5c1?xsec_token=ABU7v7vVInvnf8fC5ltbyRZB4otd4DTJlNtYGClfwWVXQ=&xsec_source="},
        {"id": "6a3dd24f000000000f0069e7", "title": "留子们放宽心，你们不会找不到工作的", "author": "吃饱再睡", "likes": "45", "url": "https://www.xiaohongshu.com/explore/6a3dd24f000000000f0069e7?xsec_token=ABA4QLws8x7eh5zF8Dt_S7KJPElnzLDvSoZxmtV-YRByI=&xsec_source="},
        {"id": "6a0c1ba4000000000702abbc", "title": "坦白说 港硕留子觉得求职中介还挺有用", "author": "Nora", "likes": "204", "url": "https://www.xiaohongshu.com/explore/6a0c1ba4000000000702abbc?xsec_token=ABgxodMhyrv6FoWS3q6MXK2_osAAu-oY6owMCqhxkvNrM=&xsec_source="},
        {"id": "6a471956000000001503cd22", "title": "红杉资本缺人，有人想来吗？可远程", "author": "一Lemon逼", "likes": "10", "url": "https://www.xiaohongshu.com/explore/6a471956000000001503cd22?xsec_token=ABi1qPtkCGX_e8Jn43be_zIkrTPXSYT1Oss9QvP3QHF9E=&xsec_source="},
        {"id": "68d417b9000000001101fa5a", "title": "港硕第一次实习面试…", "author": "睁着眼睛到天亮", "likes": "236", "url": "https://www.xiaohongshu.com/explore/68d417b9000000001101fa5a?xsec_token=ABHUXCvbtZkWJh_KZPmczF8wSsy4Mzos61TWoLwY5Ytyg=&xsec_source="},
        {"id": "68c8a0e2000000001d00ae1b", "title": "Whv 落地第三周 周薪2800", "author": "solin", "likes": "2426", "url": "https://www.xiaohongshu.com/explore/68c8a0e2000000001d00ae1b?xsec_token=AB5Guy4IYJymNF5e2DtdN8YJ4eseGHqytxL6jtM4DbOqA=&xsec_source="},
        {"id": "68060732000000000f03ad66", "title": "留学生回国一周，随便投了几个外企，结果", "author": "妮妮", "likes": "531", "url": "https://www.xiaohongshu.com/explore/68060732000000000f03ad66?xsec_token=ABMK6SnuyauddTIqwe52XdybCqlNj7xwUfQs5RGnKvAok=&xsec_source="},
    ],
    "美食推荐": [
        {"id": "690747fa00000000070238c3", "title": "挑战300碗面条不重样 第115碗！", "author": "发发爱吃面", "likes": "4.2万", "url": "https://www.xiaohongshu.com/explore/690747fa00000000070238c3?xsec_token=ABkgcDi0DblV-JmYa4HMNdxqE3xBVbITj9-iq_O__LAfI=&xsec_source="},
        {"id": "6a072c4c0000000008032ede", "title": "分享在罗湖我最爱的小店（很特别！！", "author": "五花肉的美食日记", "likes": "879", "url": "https://www.xiaohongshu.com/explore/6a072c4c0000000008032ede?xsec_token=ABNKTD0Bq9ViVDByvbnwuUA1lAHrKPHk9392LizXvp338=&xsec_source="},
        {"id": "69c7ce0b000000002301cc9c", "title": "打卡深圳黄贝岭！超级好吃的一条街！", "author": "DJ如果到", "likes": "570", "url": "https://www.xiaohongshu.com/explore/69c7ce0b000000002301cc9c?xsec_token=ABwBMAtQoZrzp4udvIRZcjaI1rqySfoj1WRZ8zW3REJ3c=&xsec_source="},
        {"id": "68ff51e00000000007009d54", "title": "在福田找好吃的，存好这6家", "author": "深圳吃货小分队", "likes": "1461", "url": "https://www.xiaohongshu.com/explore/68ff51e00000000007009d54?xsec_token=AB79dB_26lDeNnRwtlbueBgRQDWdYkzaqzlXacPFuEhc0=&xsec_source="},
        {"id": "6999c73d000000001a0280f4", "title": "（深圳）果然越不起眼的小店越好吃", "author": "Johannes", "likes": "965", "url": "https://www.xiaohongshu.com/explore/6999c73d000000001a0280f4?xsec_token=AB7mb2NDVWw2ykVNbpwpZOwdh6qp-SkEGA96vs-m2_CM4=&xsec_source="},
        {"id": "6a3a69fc00000000110196b3", "title": "爱做饭：九个超级好吃的下饭菜～", "author": "吃货三毛", "likes": "2137", "url": "https://www.xiaohongshu.com/explore/6a3a69fc00000000110196b3?xsec_token=ABqewnfS1bwiyQECqF4cLdmmTVJp8M_4pwOxDP3r8OyLA=&xsec_source="},
        {"id": "6a38f9d6000000002200934b", "title": "二人食晚餐｜吃红烧排骨和香辣虎皮鸡爪", "author": "九十九的餐桌", "likes": "3990", "url": "https://www.xiaohongshu.com/explore/6a38f9d6000000002200934b?xsec_token=ABvf89HSdceZzaolk3k_1p3Af1QOiAF9DIEby4RlBQ4ug=&xsec_source="},
        {"id": "6a0c2a1500000000080275d5", "title": "我妈尝了一口，让我原地出摊！！", "author": "小玉爱做饭", "likes": "5369", "url": "https://www.xiaohongshu.com/explore/6a0c2a1500000000080275d5?xsec_token=ABgxodMhyrv6FoWS3q6MXK203CzQCLzvHnmHHJiPS8OtM=&xsec_source="},
        {"id": "697cd266000000001a032967", "title": "深圳罗湖金光华！美食记录薄", "author": "抹茶mxu", "likes": "745", "url": "https://www.xiaohongshu.com/explore/697cd266000000001a032967?xsec_token=ABMfy3Yyk5WUaiw-W4ZDtPs_6XdhOV_DGuv_xABvoRHnw=&xsec_source="},
        {"id": "697a27f0000000000a029e95", "title": "感觉确实是深圳top.1好吃的！！！！！！", "author": "desson", "likes": "973", "url": "https://www.xiaohongshu.com/explore/697a27f0000000000a029e95?xsec_token=ABU7v7vVInvnf8fC5ltbyRZCWNBJEFAAiv_rwQPT0x904=&xsec_source="},
        {"id": "69d2724c000000001f006ef3", "title": "在福田会反复去吃的一人食堂", "author": "五花肉的美食日记", "likes": "976", "url": "https://www.xiaohongshu.com/explore/69d2724c000000001f006ef3?xsec_token=ABBMNoxVp31eQnIhmt0STYdsC96P3a9K-4JkodUSfpAxI=&xsec_source="},
        {"id": "6a26c50100000000220276b3", "title": "在深圳的11顿饭吃了什么，从夯到拉排名", "author": "小鲨", "likes": "187", "url": "https://www.xiaohongshu.com/explore/6a26c50100000000220276b3?xsec_token=AB084LSOgk0dVub-9xeYOwFA7JcDkxPNymwJ4M0JKVa8E=&xsec_source="},
        {"id": "69b93463000000002202b197", "title": "深圳南山｜会重复去吃的店", "author": "憨憨Ci欧泥包", "likes": "556", "url": "https://www.xiaohongshu.com/explore/69b93463000000002202b197?xsec_token=ABA4zpk48nc3riyRL5iO3LBkmQ5hQ8xg-8zt0gYPDan-Y=&xsec_source="},
        {"id": "6a433d62000000001101773c", "title": "罗湖朋友说从小就开始吃了", "author": "只吃亿点点", "likes": "301", "url": "https://www.xiaohongshu.com/explore/6a433d62000000001101773c?xsec_token=AB1laD7fkGdPTHPrB_MlssJxVDsAo7A7pHZvjQVKdi-nI=&xsec_source="},
        {"id": "69b29125000000001d027601", "title": "深圳南山美食推荐1-鸡西刀削面", "author": "tt", "likes": "195", "url": "https://www.xiaohongshu.com/explore/69b29125000000001d027601?xsec_token=ABwwsukEErpl9HtMVm3DIyCgYb0g8_Ky3SYIKp89Fqq2A=&xsec_source="},
        {"id": "6a2adeb300000000210156c1", "title": "深圳适合一人食的！！（12家合集", "author": "每天都想吃", "likes": "706", "url": "https://www.xiaohongshu.com/explore/6a2adeb300000000210156c1?xsec_token=ABxatAShOusy7gaxfIYb9lMts5WYSDsw9d60ggFi2gm5U=&xsec_source="},
        {"id": "6a43ab51000000001101cdca", "title": "新手必学！16道家常菜超简单", "author": "小红薯6A16640E", "likes": "1135", "url": "https://www.xiaohongshu.com/explore/6a43ab51000000001101cdca?xsec_token=AB1laD7fkGdPTHPrB_MlssJyvELPvgAtlImkvrngX2a9k=&xsec_source="},
        {"id": "699fba97000000001a0218bc", "title": "深圳探店沒踩雷｜這鵝肝Taco跟我的臉一樣闊", "author": "佘诗曼 Charmaine Sheh", "likes": "1.4万", "url": "https://www.xiaohongshu.com/explore/699fba97000000001a0218bc?xsec_token=ABnlOpLRGVefyJ4fQQyU-KuP6y4awCEO1db_eDNe3QGKg=&xsec_source="},
    ],
    "旅行攻略": [
        {"id": "6a3cff64000000000701273a", "title": "含泪整理 深圳4条精华游玩路线地图", "author": "栗栗在逃呀", "likes": "837", "url": "https://www.xiaohongshu.com/explore/6a3cff64000000000701273a?xsec_token=AB3cKP4Tgil7Ghy8Vx3FTgymuMWqYIvlcfSGd7JgZ3PnM=&xsec_source="},
        {"id": "6a2fdb7a000000001603cf07", "title": "高考完就应该去逛吃逛吃逛吃", "author": "窜天", "likes": "1255", "url": "https://www.xiaohongshu.com/explore/6a2fdb7a000000001603cf07?xsec_token=ABdXRzw2kdOyfKvhm49yFTqPRhaEerS8OReTNxMtnsKaY=&xsec_source="},
        {"id": "6a3a5f80000000000f03207c", "title": "旅行攻略分享", "author": "阿晚去旅游", "likes": "6135", "url": "https://www.xiaohongshu.com/explore/6a3a5f80000000000f03207c?xsec_token=ABqewnfS1bwiyQECqF4cLdmu34AVS5PGnEHEG03cjz68s=&xsec_source="},
        {"id": "6a33d953000000002103d8af", "title": "杭州3天2夜citywalk路线！逛吃玩全安排", "author": "环球睡袋熊", "likes": "1663", "url": "https://www.xiaohongshu.com/explore/6a33d953000000002103d8af?xsec_token=ABvaxP3JE_fxcacutrotfO_CHihJvZJUH-aZpeTeN-C2Q=&xsec_source="},
        {"id": "69b909e70000000021004f6b", "title": "旅行美食攻略", "author": "邵吃一点", "likes": "1.5万", "url": "https://www.xiaohongshu.com/explore/69b909e70000000021004f6b?xsec_token=ABA4zpk48nc3riyRL5iO3LBtwurqK4JcPFku3HDsvgU5Q=&xsec_source="},
        {"id": "69cf200e000000001a0298cb", "title": "威海2天1夜｜沉浸式看海 从日出追到日落", "author": "是如宝R", "likes": "2539", "url": "https://www.xiaohongshu.com/explore/69cf200e000000001a0298cb?xsec_token=ABT6xad1nkqAtNqj7D6JicDwc1z7DeP7N4Saa_KpeZSPQ=&xsec_source="},
        {"id": "6a0595970000000038034924", "title": "汕头南澳岛一日游｜懒人版逛吃攻略，超详细", "author": "跟着云玺去旅行", "likes": "2806", "url": "https://www.xiaohongshu.com/explore/6a0595970000000038034924?xsec_token=ABUBUn-Dh5xmXI3xCT6yg7Az644yWWG6avts4_3jSkU44=&xsec_source="},
        {"id": "69aebf3a000000001a02b509", "title": "本J人对自己做的成都攻略满意到跺jio", "author": "没烦恼小朋友", "likes": "2366", "url": "https://www.xiaohongshu.com/explore/69aebf3a000000001a02b509?xsec_token=AB3ewqwXU8tkHTOaq5uSSwOTgY8aW5bYU6u8jAJee5UMg=&xsec_source="},
        {"id": "6a43365f0000000017008f91", "title": "重庆3日游｜手绘出行攻略", "author": "大洋爱画画", "likes": "663", "url": "https://www.xiaohongshu.com/explore/6a43365f0000000017008f91?xsec_token=AB1laD7fkGdPTHPrB_MlssJwldI3TT5_-BmoaHlzVurzc=&xsec_source="},
        {"id": "69df526a000000002103852c", "title": "北京五天四夜旅游攻略", "author": "欢乐大摆锤", "likes": "1197", "url": "https://www.xiaohongshu.com/explore/69df526a000000002103852c?xsec_token=AB-mrp-PQJEQHanDZByHxBND8GSogc-ZLKaXW5NRtZgnQ=&xsec_source="},
        {"id": "6a47248c000000001c025af3", "title": "西安5日 手绘旅行攻略", "author": "一人食", "likes": "275", "url": "https://www.xiaohongshu.com/explore/6a47248c000000001c025af3?xsec_token=ABi1qPtkCGX_e8Jn43be_zIuXVhjYCQPdlVXI-s9Jz20s=&xsec_source="},
        {"id": "6a089d9c000000003502e124", "title": "沉浸式手绘｜大理旅游地图 P人狂喜", "author": "什么标准", "likes": "2488", "url": "https://www.xiaohongshu.com/explore/6a089d9c000000003502e124?xsec_token=ABGGwKNnahDklN9aqvY7Um4dsWWVvCTXM93T0IRQl7QMg=&xsec_source="},
        {"id": "6a4b8348000000002003a0b2", "title": "广州3天2夜逛吃攻略", "author": "星月神话", "likes": "13", "url": "https://www.xiaohongshu.com/explore/6a4b8348000000002003a0b2?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGFzRJHjAR6UA4rlA1ZoEU1U=&xsec_source="},
        {"id": "6a4374e8000000001702aff8", "title": "云南9大全域旅游全攻略！含票价 + 打卡点", "author": "云云睡不着", "likes": "172", "url": "https://www.xiaohongshu.com/explore/6a4374e8000000001702aff8?xsec_token=AB1laD7fkGdPTHPrB_MlssJ5J7mvBNRrHSrsKSRdxTIXQ=&xsec_source="},
        {"id": "6a4b7d0e000000002103d36b", "title": "广州5日 手绘旅行攻略", "author": "Yinsuen", "likes": "9", "url": "https://www.xiaohongshu.com/explore/6a4b7d0e000000002103d36b?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGIyEwkY2r851_c7jxiFYppU=&xsec_source="},
        {"id": "6a447de80000000015024966", "title": "苏州5日 手绘旅行攻略苏州的江南氛围", "author": "一人食", "likes": "185", "url": "https://www.xiaohongshu.com/explore/6a447de80000000015024966?xsec_token=ABFG0NLY3kex_WWkcqL_XDGodAQNgwyCbprEWWtv8RPuQ=&xsec_source="},
        {"id": "69525ed3000000001e020ea0", "title": "成都待了6年，亲测不绕路四日游路线！", "author": "糖醋排骨不要糖醋", "likes": "1.5万", "url": "https://www.xiaohongshu.com/explore/69525ed3000000001e020ea0?xsec_token=ABXnW5dBwspmadrI_bRr-i5rNfpiW2dM-SLh8vdHpNpaA=&xsec_source="},
        {"id": "6a02db160000000008026f4a", "title": "神农架 | 北纬三十度深处的秘境", "author": "洛哥在路上", "likes": "354", "url": "https://www.xiaohongshu.com/explore/6a02db160000000008026f4a?xsec_token=ABk5Ybqae-9TWeLbVPmUklyEs9yK-zAu8Wp3OGPByjQu0=&xsec_source="},
    ],
    "副业赚钱": [
        {"id": "69ed8c2e0000000023005a9c", "title": "45种赚钱门道，你选哪个？", "author": "普通人赚钱副业", "likes": "2304", "url": "https://www.xiaohongshu.com/explore/69ed8c2e0000000023005a9c?xsec_token=ABntWfYDTnpv7ttBDmv3Ssn7izrtVxuiKtiFenLFCeYjQ=&xsec_source="},
        {"id": "6874eecc0000000011003a15", "title": "工资之外，我的六种收入来源", "author": "Sora的成长日记", "likes": "3117", "url": "https://www.xiaohongshu.com/explore/6874eecc0000000011003a15?xsec_token=ABUfT-K2SdP_FO-czrpCWnXh8FJL4roCyCAYw1iWFY5JA=&xsec_source="},
        {"id": "69fabfd90000000035023012", "title": "天哪，原来AI的搞钱路数这么多", "author": "AI金三啊", "likes": "3195", "url": "https://www.xiaohongshu.com/explore/69fabfd90000000035023012?xsec_token=ABt9eG5C5hShc63S3rPOdN7iEagZzrJxSkIrPwnEQxvWk=&xsec_source="},
        {"id": "67c0517a000000000602806d", "title": "普通大学生也可以无脑复刻的搞钱路", "author": "木木水", "likes": "1597", "url": "https://www.xiaohongshu.com/explore/67c0517a000000000602806d?xsec_token=ABB3ngale7F8iQg-cXTwAIOYJE66mbJ-QudlRmlEEHeL4=&xsec_source="},
        {"id": "6769797d000000000900f10b", "title": "果然赚钱最快的方法就是当二道贩子", "author": "寒易", "likes": "1.7万", "url": "https://www.xiaohongshu.com/explore/6769797d000000000900f10b?xsec_token=ABGqVKb-WjrM93Lj4r-RTui0K0lyYbq4L2FNlxFryRQFg=&xsec_source="},
        {"id": "69f1f86f00000000380217c5", "title": "搞钱最快的24种方法", "author": "阿龙爆品解说", "likes": "1439", "url": "https://www.xiaohongshu.com/explore/69f1f86f00000000380217c5?xsec_token=ABwlMS_LV8koElCUSRRBXOF4Kz6k_66WqyaT895Ya15ro=&xsec_source="},
        {"id": "6816ddd7000000002001e3b7", "title": "AI搞钱！美国小哥靠AI绘本狂赚10万刀", "author": "grow（AI版加强版）", "likes": "1283", "url": "https://www.xiaohongshu.com/explore/6816ddd7000000002001e3b7?xsec_token=ABNuzBE7VqIQWZ8cojGmQxl6Xt52oBKhQ_FlBteLqdLIc=&xsec_source="},
        {"id": "6a15745a000000000702def2", "title": "普通人下班后如何赚第二份钱？", "author": "Mr.Cheese", "likes": "343", "url": "https://www.xiaohongshu.com/explore/6a15745a000000000702def2?xsec_token=ABbablqVVS7wIpDLuQkkJDtUUST2j5MrAXY6pv-OsLzHQ=&xsec_source="},
        {"id": "697225e9000000001a02038b", "title": "副业赚钱实操分享", "author": "呆呆", "likes": "470", "url": "https://www.xiaohongshu.com/explore/697225e9000000001a02038b?xsec_token=ABOiiSdjX6BtVFPcSrAaAqkg2WJpI7dFDsz0t2kQYfLBk=&xsec_source="},
        {"id": "669f6dac000000002701ba92", "title": "分享普通人在家可做的6个工作", "author": "努力攒钱的大王", "likes": "3102", "url": "https://www.xiaohongshu.com/explore/669f6dac000000002701ba92?xsec_token=ABjy9b6xwQq7HKjagqZuwRtxTdKgU96HagbPx44FXpWe0=&xsec_source="},
        {"id": "69e058190000000022003ba3", "title": "在读研究生挑战使用ai收入100w day4", "author": "呆鹅的创业实战笔记", "likes": "284", "url": "https://www.xiaohongshu.com/explore/69e058190000000022003ba3?xsec_token=ABUOy852gNJk-WJMbyd_a3CZB7HGebpl6ZrMfFg2Bak7M=&xsec_source="},
        {"id": "69e24c83000000001b021cf6", "title": "下班后2小时，可做9个小收入", "author": "蔓蔓", "likes": "666", "url": "https://www.xiaohongshu.com/explore/69e24c83000000001b021cf6?xsec_token=ABT-s1O8nX2IvK75FlErM05GonkU8TCB1Agt_xkoQmvEA=&xsec_source="},
        {"id": "6970dc03000000000a02d631", "title": "搞副业最猛的城市：深圳", "author": "Vivian", "likes": "401", "url": "https://www.xiaohongshu.com/explore/6970dc03000000000a02d631?xsec_token=AByN_iEFqpuaNE3kWdxk8awPRS-nCz0qwVxLndrKkW_AQ=&xsec_source="},
        {"id": "6a471b1a00000000160253f6", "title": "已老实！1688倒卖，10天自动接了847單", "author": "银铭时", "likes": "111", "url": "https://www.xiaohongshu.com/explore/6a471b1a00000000160253f6?xsec_token=ABi1qPtkCGX_e8Jn43be_zIrSSJUxgVixpC8aahetrn08=&xsec_source="},
        {"id": "666d8e7c000000000d00df97", "title": "大二创业｜学会做内容生产者", "author": "Kk（搞钱版）", "likes": "2513", "url": "https://www.xiaohongshu.com/explore/666d8e7c000000000d00df97?xsec_token=ABzuM1_OMlOp1Lku_QToWJYNRjDn2zPXfD5R5qVnxfGgM=&xsec_source="},
        {"id": "6988c5a3000000002800b0ee", "title": "普通程序员，每天三份工作，副业已经超过主业", "author": "深漂程序员犬夜叉", "likes": "835", "url": "https://www.xiaohongshu.com/explore/6988c5a3000000002800b0ee?xsec_token=ABljN9biGItTXo4GsjbuPOEuITVdLYw4Rk8Zw2o76JTkI=&xsec_source="},
        {"id": "6721edb5000000001a01ff73", "title": "搞钱app", "author": "不想多说", "likes": "2.7万", "url": "https://www.xiaohongshu.com/explore/6721edb5000000001a01ff73?xsec_token=ABeE6a1GfcsfdbNfM1w8qFns3D67UqFreED03YpoAolR0=&xsec_source="},
        {"id": "6a0ad99f0000000036030fa8", "title": "ai到底怎么挣钱！", "author": "mimi", "likes": "3336", "url": "https://www.xiaohongshu.com/explore/6a0ad99f0000000036030fa8?xsec_token=ABgeSYHvb1qS17W3H8_zzYMiNzhuJGHTyiQTtT-g0I7HA=&xsec_source="},
        {"id": "69e767dc000000001f007df7", "title": "赚钱副业分享", "author": "薇薇看电影", "likes": "1133", "url": "https://www.xiaohongshu.com/explore/69e767dc000000001f007df7?xsec_token=ABFsPMssa-cN8XnZOIDej3h5tGaT2GlhkqjL0SrfKLDWw=&xsec_source="},
        {"id": "681d7a8b0000000012006ccf", "title": "副业赚钱经验", "author": "向上", "likes": "150", "url": "https://www.xiaohongshu.com/explore/681d7a8b0000000012006ccf?xsec_token=ABJK7gXtOjsJlEP91R2Sh9Ub8BPxP6FdIrR88woDZx-7E=&xsec_source="},
    ],
    "留学申请": [
        {"id": "69c110a6000000001b000b33", "title": "新手找留学中介第一步到底要干嘛？（纯干货", "author": "Sunlight", "likes": "358", "url": "https://www.xiaohongshu.com/explore/69c110a6000000001b000b33?xsec_token=AB6JwNI80CsfATe6fzXWs0cJVWrAvvNYHmBSeU3QxrH_k=&xsec_source="},
        {"id": "6a1ed23d00000000370364e0", "title": "民办➡️浸会 真双非27fall常问的问题", "author": "Cookiee-", "likes": "90", "url": "https://www.xiaohongshu.com/explore/6a1ed23d00000000370364e0?xsec_token=ABErONqxX1IWZ5WCwHOIpKXwz8P5lhlRwGj0r0pr4S_wk=&xsec_source="},
        {"id": "695a1635000000001e016122", "title": "留学申请经验", "author": "钱包好陳", "likes": "449", "url": "https://www.xiaohongshu.com/explore/695a1635000000001e016122?xsec_token=ABniLidS7z8BWbi8j6d9WCTBtmVFxJHqncxrqJyTdsY10=&xsec_source="},
        {"id": "6a046cbf00000000080258d4", "title": "我发现了避雷留学中介巨快的方法（亲测）", "author": "小涵今天要早起", "likes": "335", "url": "https://www.xiaohongshu.com/explore/6a046cbf00000000080258d4?xsec_token=ABaqskpDPx3Pfti_Vg3z2UngNq5Zr0tHUiagh5fkS6Itg=&xsec_source="},
        {"id": "69ba8a3d000000002200116e", "title": "双非无压力录取 HKcityu可持续发展硕士", "author": "dokiiiiii", "likes": "53", "url": "https://www.xiaohongshu.com/explore/69ba8a3d000000002200116e?xsec_token=AB4Q1hQI3IAtqOwV6wFgPsZzKbVU2rlNkGBdUl4BzOV8c=&xsec_source="},
        {"id": "69fb0b74000000003701d5d8", "title": "26fall港硕给27fall找留学中介的10个忠告", "author": "伊豆儿", "likes": "354", "url": "https://www.xiaohongshu.com/explore/69fb0b74000000003701d5d8?xsec_token=ABCfxMQsSTTJYyVK304N5LdhstKPIo_haL1KbbwjFvCxI=&xsec_source="},
        {"id": "697a0441000000001a02a066", "title": "香港理工大学IGDS-SCLM项目申请攻略", "author": "一朝梦醒落星辰", "likes": "103", "url": "https://www.xiaohongshu.com/explore/697a0441000000001a02a066?xsec_token=ABU7v7vVInvnf8fC5ltbyRZFFsMKI9TjqmmFVEaO_A7-4=&xsec_source="},
        {"id": "6a2b78eb000000001503cbfd", "title": "双非DIY港科大offer（极限晚申", "author": "格一粒", "likes": "19", "url": "https://www.xiaohongshu.com/explore/6a2b78eb000000001503cbfd?xsec_token=AB3BTV0LVHB59-fWC8yhYuDo88J1SpGRGkgIJtwHirTUM=&xsec_source="},
        {"id": "69b28168000000001b014e98", "title": "26fall申请季DIY成果结算 附DIY经验分享", "author": "Christina水泥", "likes": "323", "url": "https://www.xiaohongshu.com/explore/69b28168000000001b014e98?xsec_token=ABwwsukEErpl9HtMVm3DIyCqhE5857bJVZ5Oi8ol14uEk=&xsec_source="},
        {"id": "6a4b0b6500000000110062dd", "title": "留学申请心得", "author": "一口抹茶奶冻", "likes": "52", "url": "https://www.xiaohongshu.com/explore/6a4b0b6500000000110062dd?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGF-VtnW6AprN8tDXhfv6T5s=&xsec_source="},
        {"id": "6a4b24ee000000000f033d26", "title": "普通背景申请留学的一点真实感受", "author": "活活血吧", "likes": "4", "url": "https://www.xiaohongshu.com/explore/6a4b24ee000000000f033d26?xsec_token=ABZgLWrO5AB7xt3n8WIx7lGNqY6Hp1jMbLX6EEuxGeCPQ=&xsec_source="},
        {"id": "6a37e3e7000000002103e91d", "title": "答疑|主要面向27fall港硕申请（长期有效）", "author": "伽利略的望远镜（HKU版）", "likes": "79", "url": "https://www.xiaohongshu.com/explore/6a37e3e7000000002103e91d?xsec_token=ABpMBhzPZV9sXC-jLr06W5QAkigTR251XndWlHGEX_BUY=&xsec_source="},
        {"id": "69e88c8c000000001f0035db", "title": "26fall港校DIY 在职党CityU收留版 申请tips", "author": "冇慢待", "likes": "37", "url": "https://www.xiaohongshu.com/explore/69e88c8c000000001f0035db?xsec_token=ABsiRoGV-yU0Uk_HWm15bk0EAjueSaMc-Uk6OJs1Kes6Y=&xsec_source="},
        {"id": "6a3cd74f0000000006020dd1", "title": "27fall留学申请时间线 看这篇就够了", "author": "留子范进", "likes": "7", "url": "https://www.xiaohongshu.com/explore/6a3cd74f0000000006020dd1?xsec_token=AB3cKP4Tgil7Ghy8Vx3FTgyuRjXHuayAMQ8u5GbkxAw0s=&xsec_source="},
        {"id": "674a8fe7000000000203892d", "title": "1万以内搞定留学申请，前提是你肯照做", "author": "小鹿又超神了", "likes": "2386", "url": "https://www.xiaohongshu.com/explore/674a8fe7000000000203892d?xsec_token=ABY9X0hgxQ4tdXn-RanoK3KMF_O9jtldvraOs0p6taAIw=&xsec_source="},
        {"id": "6905de2200000000050039d8", "title": "自己diy真的可以吗", "author": "气质喵", "likes": "661", "url": "https://www.xiaohongshu.com/explore/6905de2200000000050039d8?xsec_token=ABTIVI81D8cZ05VJogHL8WVYH-_8zfIl5PECT3MJWNcHw=&xsec_source="},
        {"id": "6a3de1b3000000000e031400", "title": "挑战全网27fall提前批港中文第一个offer！", "author": "小九", "likes": "169", "url": "https://www.xiaohongshu.com/explore/6a3de1b3000000000e031400?xsec_token=ABA4QLws8x7eh5zF8Dt_S7KB0jumjdDw2W3WkNkJMrmDM=&xsec_source="},
        {"id": "6a242673000000003501f22b", "title": "27fall 不用中介的DIY攻略", "author": "Aris", "likes": "2218", "url": "https://www.xiaohongshu.com/explore/6a242673000000003501f22b?xsec_token=ABxh4pK8Lfn7xCFggxisVpgpSFFaxkp1cllzY84Z8do2E=&xsec_source="},
    ],
    "职场经验": [
        {"id": "69a6f5c1000000001a03072b", "title": "打工而已，不要内耗自己", "author": "阳光少女日记", "likes": "470", "url": "https://www.xiaohongshu.com/explore/69a6f5c1000000001a03072b?xsec_token=ABqcpk1CNOfuuxovLN649K0ib8odq90JrtilY6-XMAgzI=&xsec_source="},
        {"id": "6762d2ae000000001300a656", "title": "和同事相处，没必要小心翼翼！", "author": "职场秘籍", "likes": "5500", "url": "https://www.xiaohongshu.com/explore/6762d2ae000000001300a656?xsec_token=AB3Z3rm5oi7b9g2FXGLOlpIoqjM4E305Izj3GQrNM9Zfg=&xsec_source="},
        {"id": "68d50ab2000000000e00d5ba", "title": "带有学生思维的人很像职场巨婴", "author": "simo", "likes": "227", "url": "https://www.xiaohongshu.com/explore/68d50ab2000000000e00d5ba?xsec_token=ABZ_JbgLI64WmWupq7Vzm88iUrHGv8nFeplrx5VwszmK4=&xsec_source="},
        {"id": "69dd9b4e000000001d01f213", "title": "职场沟通很强的人都会建立SOP", "author": "Y姐的职场日记", "likes": "4585", "url": "https://www.xiaohongshu.com/explore/69dd9b4e000000001d01f213?xsec_token=ABh5JUj4moWdMDeKNA7-zlu9g55NUjNd7Wintcbe3FTlQ=&xsec_source="},
        {"id": "6a2ef89a00000000070296a4", "title": "毕业一年的社会化指南", "author": "小昱碎碎念", "likes": "4.2万", "url": "https://www.xiaohongshu.com/explore/6a2ef89a00000000070296a4?xsec_token=ABbxDydCtupzN42VyRxAdYlpMdA9wSAi1aln6Uu-ihTg4=&xsec_source="},
        {"id": "6a0d7f90000000003501f321", "title": "入职第一天，千万别傻坐工位", "author": "洲洲", "likes": "1102", "url": "https://www.xiaohongshu.com/explore/6a0d7f90000000003501f321?xsec_token=ABt9ibS5cnarEHwYZDJytRQHsjvQYV9tv_J0I7YD78kOA=&xsec_source="},
        {"id": "6921adce000000001d03e693", "title": "改掉你职场里的孩子气", "author": "墨寒", "likes": "2834", "url": "https://www.xiaohongshu.com/explore/6921adce000000001d03e693?xsec_token=ABJxoPF-QFWB-tjm8oN4cyVSqlCu8VR80zbmoUsStDc0Q=&xsec_source="},
        {"id": "68d520ab0000000007029b5f", "title": "工作能力强的人，都会搭建SOP", "author": "kiki进化论", "likes": "7803", "url": "https://www.xiaohongshu.com/explore/68d520ab0000000007029b5f?xsec_token=ABZ_JbgLI64WmWupq7Vzm88rzAGZQM5XfNv5wH_w3GI98=&xsec_source="},
        {"id": "695a2e19000000001f00fad0", "title": "职场嘴笨自救攻略", "author": "职场鸭鸭", "likes": "1.1万", "url": "https://www.xiaohongshu.com/explore/695a2e19000000001f00fad0?xsec_token=ABniLidS7z8BWbi8j6d9WCTOIji2e5bb4kk_Y66s-0vI8=&xsec_source="},
        {"id": "6a04457b000000003601dcb4", "title": "互联网校招入职快两年职场心得｜给新人（二）", "author": "一打泡泡泡", "likes": "330", "url": "https://www.xiaohongshu.com/explore/6a04457b000000003601dcb4?xsec_token=ABaqskpDPx3Pfti_Vg3z2UnimzgcFr5SoaKMXCsQvMqz0=&xsec_source="},
        {"id": "6862a04b000000000b01e6a9", "title": "给应届毕业生初入职场的一些tips", "author": "开心潇潇乐", "likes": "3300", "url": "https://www.xiaohongshu.com/explore/6862a04b000000000b01e6a9?xsec_token=ABCx40i-bx3s01RuE-hHZjxo9_M0T-qO3UH4rWa_l-aGQ=&xsec_source="},
        {"id": "687de0bd00000000230067ee", "title": "实习生千万不要把任务太当回事", "author": "木子 (实习版)", "likes": "4500", "url": "https://www.xiaohongshu.com/explore/687de0bd00000000230067ee?xsec_token=ABnJZk0Rc3m3AYmm4SiSCYB8bTK61qQqJwNuyxLMRALJU=&xsec_source="},
        {"id": "69b660b30000000021006586", "title": "咋深度思考？", "author": "刚哥的运营笔记", "likes": "2.8万", "url": "https://www.xiaohongshu.com/explore/69b660b30000000021006586?xsec_token=ABnzNw1jRNhmUgvno0fie0NyMBG6BEApTlXjdu-JBrqdA=&xsec_source="},
        {"id": "67346c77000000001901677f", "title": "工作10年总结出的100个职场小细节", "author": "青简余香", "likes": "4023", "url": "https://www.xiaohongshu.com/explore/67346c77000000001901677f?xsec_token=ABSX4GA-yXDynGXNpNQhWaJi8Z2XOgLcN7fVYvmxKDAQQ=&xsec_source="},
        {"id": "68904a7e000000002501f199", "title": "原来职场有心眼子和没心眼子的差别真的很大", "author": "小6真的666", "likes": "6192", "url": "https://www.xiaohongshu.com/explore/68904a7e000000002501f199?xsec_token=AB-3g7Udv3mA7LN0y1oUeUBXl4NC4VFrtcxYGmuObrS_k=&xsec_source="},
        {"id": "687115170000000012017df2", "title": "mentor视角：我发现很多实习生根本不会small talk", "author": "郑悦尔", "likes": "5970", "url": "https://www.xiaohongshu.com/explore/687115170000000012017df2?xsec_token=ABdvRNxmth-lhx4guCtmdTEtssGEeMJqVyvAmfBOgOOCE=&xsec_source="},
        {"id": "6a0c3f64000000000803e1ea", "title": "应届生即将入职银行，一定要看", "author": "黄米粒", "likes": "284", "url": "https://www.xiaohongshu.com/explore/6a0c3f64000000000803e1ea?xsec_token=ABgxodMhyrv6FoWS3q6MXK2__uo403--97PUrbeSPwicg=&xsec_source="},
        {"id": "67386ce7000000001a034d65", "title": "给职场新人的一些经验", "author": "淡淡的葱酱", "likes": "3369", "url": "https://www.xiaohongshu.com/explore/67386ce7000000001a034d65?xsec_token=ABmfwURqhbTGa8y4nbH8xp9Ibs_ayfnvuT22ZL_3MinrU=&xsec_source="},
    ],
    "穿搭分享": [
        {"id": "68a43237000000001b0312b1", "title": "1500大学生夏季休闲穿搭分享", "author": "一椰包富", "likes": "1394", "url": "https://www.xiaohongshu.com/explore/68a43237000000001b0312b1?xsec_token=ABigwe7RI9wPtPf6ct66NrFTOLRcBpRdgIIiO_m_EoRqc=&xsec_source="},
        {"id": "688b433b0000000023039953", "title": "韩国男生穿搭，真的绝了！", "author": "雪饼", "likes": "4421", "url": "https://www.xiaohongshu.com/explore/688b433b0000000023039953?xsec_token=AB14VmJxnjXWg0uNvL4O44rnsAnxtI0S1-f7PozP1SKRY=&xsec_source="},
        {"id": "69e73bc5000000001d01801f", "title": "cleanfit 懒人版｜男生 8 套夏日 5 分钟出", "author": "yaya（穿搭分享）", "likes": "842", "url": "https://www.xiaohongshu.com/explore/69e73bc5000000001d01801f?xsec_token=ABFsPMssa-cN8XnZOIDej3h5lOFrBM2oZ0IKFOroLYkoI=&xsec_source="},
        {"id": "6a02f94e0000000035029566", "title": "OOTD｜夏天的穿搭合集", "author": "小R同学", "likes": "1445", "url": "https://www.xiaohongshu.com/explore/6a02f94e0000000035029566?xsec_token=ABk5Ybqae-9TWeLbVPmUklyCDe-EBi0lVQ1_85lwOlSLE=&xsec_source="},
        {"id": "6a20f60c00000000080309aa", "title": "人夫感一周穿搭合集", "author": "颜宇330", "likes": "105", "url": "https://www.xiaohongshu.com/explore/6a20f60c00000000080309aa?xsec_token=ABfrut63bnbLm7n2e53r45HwFynrP0ibHUoVA-tz7KJvA=&xsec_source="},
        {"id": "6a004096000000003503b01c", "title": "Blue Hour", "author": "chaohoho", "likes": "1379", "url": "https://www.xiaohongshu.com/explore/6a004096000000003503b01c?xsec_token=ABUMGY_rf5J9_Mka2QCpWdOqdNa8CxH4SwurUiqrR2ykU=&xsec_source="},
        {"id": "6a1574cd0000000035030312", "title": "一周球衣穿搭分享 穿自己喜欢的", "author": "无业游男", "likes": "1498", "url": "https://www.xiaohongshu.com/explore/6a1574cd0000000035030312?xsec_token=ABbablqVVS7wIpDLuQkkJDtUBHzaP1xE8xNIa5DPYgzsM=&xsec_source="},
        {"id": "69fdfbfe0000000035028e92", "title": "一周穿搭合集｜夏季穿搭", "author": "0n1ine", "likes": "2243", "url": "https://www.xiaohongshu.com/explore/69fdfbfe0000000035028e92?xsec_token=ABJlrYzbSRp6nKmLgEokYY9eldX-ScjmZutQaCJjW_Ijc=&xsec_source="},
        {"id": "69da3f2500000000230244c8", "title": "我的一周穿搭合集", "author": "0n1ine", "likes": "1292", "url": "https://www.xiaohongshu.com/explore/69da3f2500000000230244c8?xsec_token=ABVRO03AbKVnV3KXJAbaeT1fM90zOi0xOBXDP6UCDHKKU=&xsec_source="},
        {"id": "6a3410d1000000001702be4d", "title": "一周穿搭合集来啦！！！", "author": "吴文", "likes": "73", "url": "https://www.xiaohongshu.com/explore/6a3410d1000000001702be4d?xsec_token=ABpTPMIxjVzwGJNtvDlz54icAVqlR4jmQ5XMjoUjD-XMs=&xsec_source="},
        {"id": "69e75217000000001b002f83", "title": "我的春夏穿搭合集", "author": "Jim9ie-", "likes": "2312", "url": "https://www.xiaohongshu.com/explore/69e75217000000001b002f83?xsec_token=ABFsPMssa-cN8XnZOIDej3h-LUyaTZO1lg28-zK96aK6A=&xsec_source="},
        {"id": "6a3d22a10000000011007e51", "title": "夏日漂亮衣服合集", "author": "Tttt_", "likes": "2623", "url": "https://www.xiaohongshu.com/explore/6a3d22a10000000011007e51?xsec_token=ABA4QLws8x7eh5zF8Dt_S7KKVDcdgy5i08iCAGTRl5pWs=&xsec_source="},
        {"id": "6a02eced000000003601da0b", "title": "韩系穿搭合集｜男生日常穿搭6套", "author": "我与辰晨", "likes": "424", "url": "https://www.xiaohongshu.com/explore/6a02eced000000003601da0b?xsec_token=ABk5Ybqae-9TWeLbVPmUklyINDYLlSvgP3HrP1ua47Dn0=&xsec_source="},
        {"id": "68867a390000000013010777", "title": "提升衣品穿搭捷径 试试网购这样搜！", "author": "高川", "likes": "1.3万", "url": "https://www.xiaohongshu.com/explore/68867a390000000013010777?xsec_token=ABKjdn_fwrf6eRrDJfZpTvrNA03F1vgtemmU_BWP43xRk=&xsec_source="},
        {"id": "69df5caf000000001d01b1ac", "title": "165-175 小个子男生｜8 套夏日显高穿搭", "author": "yaya（穿搭分享）", "likes": "246", "url": "https://www.xiaohongshu.com/explore/69df5caf000000001d01b1ac?xsec_token=AB-mrp-PQJEQHanDZByHxBNAitl7LldliTi-Fdo1DJyjY=&xsec_source="},
        {"id": "687b573e000000000b02e827", "title": "攒了一整年的夏季穿搭", "author": "Nanase", "likes": "1079", "url": "https://www.xiaohongshu.com/explore/687b573e000000000b02e827?xsec_token=ABx1s80T2-b3qRE2VMCJfRz-X95L3wfiMb7NlWnc8YdKc=&xsec_source="},
        {"id": "68a1ba64000000001d00f93d", "title": "一周街头穿搭分享 穿自己喜欢的", "author": "无业游男", "likes": "1415", "url": "https://www.xiaohongshu.com/explore/68a1ba64000000001d00f93d?xsec_token=ABFUNAboCSmzWIHmi7qpstWa2tTcw7LuK1gjMfqFFScJA=&xsec_source="},
        {"id": "6a4687080000000016027765", "title": "一周穿搭合集来啦！！！", "author": "吴文", "likes": "14", "url": "https://www.xiaohongshu.com/explore/6a4687080000000016027765?xsec_token=ABHV6zBuKgxYPzya_KCYEoGi52NbBzm8FFUuKFn3cSctU=&xsec_source="},
    ],
}


def clean_author(author: str) -> str:
    """清理作者名，去除日期后缀"""
    # 去除各种日期格式后缀
    author = re.sub(r'\d+天前$', '', author)
    author = re.sub(r'\d+小时前$', '', author)
    author = re.sub(r'\d+分钟前$', '', author)
    author = re.sub(r'昨天.*$', '', author)
    author = re.sub(r'\d{2}-\d{2}$', '', author)
    author = re.sub(r'\d{4}-\d{2}-\d{2}$', '', author)
    author = re.sub(r'\d+前$', '', author)
    return author.strip()


def extract_date(author: str) -> str:
    """从作者字段提取日期"""
    # 匹配 MM-DD 格式
    m = re.search(r'(\d{2}-\d{2})', author)
    if m:
        return f"2026-{m.group(1)}"
    # 匹配 X天前
    m = re.search(r'(\d+)天前', author)
    if m:
        return f"{m.group(1)}天前"
    # 匹配 X小时前
    m = re.search(r'(\d+)小时前', author)
    if m:
        return f"{m.group(1)}小时前"
    # 匹配 昨天
    if '昨天' in author:
        return "昨天"
    # 匹配 X分钟前
    m = re.search(r'(\d+)分钟前', author)
    if m:
        return f"{m.group(1)}分钟前"
    return ""


def build_database():
    """构建去重的数据库"""
    db = {}
    
    for keyword, notes in SCRAPE_DATA.items():
        for note in notes:
            note_id = note["id"]
            if note_id in db:
                # 已存在，只添加关键词
                db[note_id]["search_keywords"].append(keyword)
            else:
                # 新条目
                author_raw = note.get("author", "")
                db[note_id] = {
                    "id": note_id,
                    "title": note.get("title", ""),
                    "author": clean_author(author_raw),
                    "publish_time": extract_date(author_raw),
                    "likes": note.get("likes", "0"),
                    "url": note.get("url", ""),
                    "search_keywords": [keyword],
                    "type": "图文",
                }
    
    return list(db.values())


def main():
    db = build_database()
    
    output_path = Path(__file__).parent / "xhs_notes_db.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "total": len(db),
            "keywords": list(SCRAPE_DATA.keys()),
            "notes": db,
        }, f, ensure_ascii=False, indent=2)
    
    print(f"数据库构建完成！共 {len(db)} 条去重记录")
    print(f"关键词覆盖: {', '.join(SCRAPE_DATA.keys())}")
    print(f"保存到: {output_path}")


if __name__ == "__main__":
    main()
