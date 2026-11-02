export interface BookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  titleHindi?: string;
  author: string;
  language: 'hindi' | 'english';
  genre: string;
  coverColor: string;
  description: string;
  chapters: BookChapter[];
}

export const BOOK_LIBRARY: Book[] = [
  // 1. GODAAN - MUNSHI PREMCHAND (HINDI)
  {
    id: 'godaan',
    title: 'Godaan (गोदान)',
    titleHindi: 'गोदान',
    author: 'मुंशी प्रेमचंद (Munshi Premchand)',
    language: 'hindi',
    genre: 'Classic Hindi Literature',
    coverColor: 'linear-gradient(135deg, #b45309, #d97706)',
    description: 'भारतीय ग्रामीण जीवन, किसान संघर्ष और मानवीय संवेदनाओं का अमर महाकाव्य।',
    chapters: [
      {
        id: 'godaan-ch1',
        chapterNumber: 1,
        title: 'अध्याय १: होरी का गाय का स्वप्न',
        wordCount: 295,
        content: `होरी राम ने दोनों बैलों को सानी-पानी देकर अपनी पत्नी धनिया से कहा—गोबर को जरा होशियार कर देना। आज बाँस कटने आएँगे। वह सबेरे ही खेत पर चला जाए।

धनिया ने अपने पुराने आँचल से मुँह पोंछते हुए कहा—तुम भी तो वहीं जा रहे हो? ज़रा देर में चले जाना।

होरी ने लाठी कंधे पर रखी और बोला—मेरा जाना ज़रूरी है। मालिक के दरबार में आज सलाम करने जाना है। पता नहीं आज क्या हुक्म हो। राय साहब का मिज़ाज तो जानते ही हो, बात-बात में नाराज़ हो जाते हैं।

धनिया ने माथा सिकोड़ कर कहा—तुम तो बात-बात में डरते हो। साल भर मेहनत करो और फिर भी उनके पाँव पूजो। कभी सोचा है कि घर में एक गाय तक नहीं है। बच्चे दूध की बूँद को तरसते हैं। एक पछाईं गाय होती तो कितना सुख होता। द्वार पर बंधी गाय गृहस्थी की शोभा बढ़ा देती है।

होरी के दिल में भी गाय की लालसा बरसों से सुलग रही थी। उसने मन ही मन सोचा कि अगर भगवान ने चाहा तो इस साल भोला से एक गाय उधार ज़रूर ले लेगा। पछाईं गाय के सींग बड़े सुंदर होते हैं और वह दूध भी खूब देती है।

वह पगडंडी पर आगे बढ़ चला। चारों ओर हरी-भरी फसलें लहलहा रही थीं। किसान अपने खेतों में हल चला रहे थे और चिड़ियों की चहचहाहट से पूरा वातावरण गूँज रहा था। जीवन के कठिन संघर्षों के बीच भी होरी के मन में आशा की एक नई किरण चमक रही थी।`
      },
      {
        id: 'godaan-ch2',
        chapterNumber: 2,
        title: 'अध्याय २: राय साहब का दरबार',
        wordCount: 310,
        content: `राय साहब अमरपाल सिंह का दीवानखाना सवेरे से ही लोगों से भरा हुआ था। गाँव के मुखिया, पटवारी, साहूकार और कई असामी अपने-अपने मुकदमों और अर्ज़ियों को लेकर पंक्ति में खड़े थे।

राय साहब अपने बड़े कमरे में गद्देदार कुर्सी पर बैठे हुक्का गुड़गुड़ा रहे थे। उनके चेहरे पर गंभीरता थी, पर आँखों में चालाकी साफ़ झलकती थी। जब होरी ने कमरे में कदम रखा, तो उसने झुककर तीन बार सलाम किया और चुपचाप एक कोने में हाथ जोड़कर खड़ा हो गया।

राय साहब ने नज़र उठाकर देखा और बोले—क्यों होरी, इस साल लगान कब तक जमा होगा? सुना है तुम्हारी ऊख की फसल अच्छी है।

होरी ने गिड़गिड़ाते हुए निवेदन किया—माई-बाप, फसल तो ठीक है, लेकिन महाजन का कर्ज़ और घर का खर्च इतना है कि लगान चुकाने के लिए दो महीने की मोहलत चाहिए। अगर आप दया नहीं करेंगे तो बाल-बच्चे भूखों मर जाएँगे।

राय साहब मुस्कुराए और बोले—तुम किसान लोग हमेशा यही रोना रोते हो। कभी किसी ने यह नहीं कहा कि इस बार मालिक को नजराना पेश करना है। खैर, इस बार दशहरा मेले के लिए चंदा देना पड़ेगा।

होरी ने सिर झुका लिया। वह जानता था कि ज़मींदार की हाँ में हाँ मिलाने के सिवा उसके पास कोई दूसरा चारा नहीं था। सामंती व्यवस्था के इस दबाव को वह अपनी नियति मान चुका था, फिर भी उसके मन में अपनी मर्यादा बचाने की अदम्य इच्छा थी।`
      },
      {
        id: 'godaan-ch3',
        chapterNumber: 3,
        title: 'अध्याय ३: भोला की गाय और सौदा',
        wordCount: 285,
        content: `शाम का समय था। सूरज पश्चिम के पहाड़ों के पीछे ढल रहा था और गाँव के मवेशी धूल उड़ाते हुए घरों की ओर लौट रहे थे। होरी चलते-चलते भोला के गाँव पहुँच गया।

भोला अहीर अपने दलान पर बैठा सन की रस्सी बाँट रहा था। होरी को देखते ही उसने आदरपूर्वक खाट पर बैठने का इशारा किया और तंबाकू की चिलम भर दी।

होरी ने बातों-बातों में गाय की चर्चा छेड़ी—भोला भाई, तुम्हारे पास तो कई बढ़िया गायें हैं। हमारी गृहस्थी में भी एक गाय आ जाए तो भगवान का बड़ा उपकार होगा। क्या कोई गाय हमें दे सकते हो?

भोला ने एक गहरी साँस ली और कहा—होरी भाई, देने को तो दे दूँ, लेकिन आजकल भूसे का बड़ा अकाल है। मेरी लाल गाय ब्याने वाली है और दस सेर दूध देती है। अगर अस्सी रुपये नकद मिल जाएँ तो बात बने।

होरी के पास नकद रुपये कहाँ थे। उसने भोला को समझाया कि फसल कटने पर वह पाई-पाई चुकता कर देगा। दोनों के बीच देर तक बातचीत चलती रही। अंत में भोला इस शर्त पर राजी हुआ कि होरी उसके लिए जंगल से लकड़ी और भूसे का प्रबंध करेगा।

होरी का दिल खुशी से नाच उठा। गाय लेकर जब वह अपने गाँव लौटा, तो धनिया और बच्चे उसे देखकर फूले न समाए। पूरा मोहल्ला उस सुंदर पछाईं गाय को देखने इकट्ठा हो गया था।`
      }
    ]
  },

  // 2. KAFAN - MUNSHI PREMCHAND (HINDI)
  {
    id: 'kafan',
    title: 'Kafan (कफ़न)',
    titleHindi: 'कफ़न',
    author: 'मुंशी प्रेमचंद (Munshi Premchand)',
    language: 'hindi',
    genre: 'Classic Hindi Short Stories',
    coverColor: 'linear-gradient(135deg, #475569, #334155)',
    description: 'चरम निर्धनता, सामाजिक विसंगतियों और मानवीय संवेदनहीनता पर प्रेमचंद की सबसे चर्चित यथार्थवादी कहानी।',
    chapters: [
      {
        id: 'kafan-ch1',
        chapterNumber: 1,
        title: 'भाग १: झोपड़े के द्वार पर',
        wordCount: 305,
        content: `झोपड़े के द्वार पर बाप और बेटा दोनों एक बुझे हुए अलाव के सामने चुपचाप बैठे थे और अंदर बेटे की जवान बीवी बुधिया प्रसव-वेदना से तड़प रही थी। रह-रहकर उसके मुँह से ऐसी दिल दहलाने वाली चीख़ निकलती थी कि दोनों कलेजा थाम लेते थे।

जाड़ों की रात थी। प्रकृति सन्नाटे में डूबी हुई थी और सारा गाँव अंधकार में सोया हुआ था।

घीसू ने कहा—मालूम होता है बचेगी नहीं। सारा दिन तड़पते हो गया। जा, देख तो आ।

माधव चिढ़कर बोला—मरना ही है तो जल्दी मर क्यों नहीं जाती, देखकर क्या करूँ?

घीसू बोला—तू बड़ा बेदर्द है रे! साल भर जिसके साथ सुख-चैन से रहा, उसी के साथ ऐसी बेवफ़ाई!

माधव ने कहा—तो मुझसे उसका तड़पना नहीं देखा जाता।

दोनों चमार जाति के थे और पूरे गाँव में बदनाम थे। घीसू एक दिन काम करता तो तीन दिन आराम करता। माधव इतना आलसी था कि आधे घंटे काम करता तो घंटे भर चिलम पीता। इसलिए उन्हें कोई मज़दूरी पर न रखता था। घर में अगर मुट्ठी भर भी अनाज मौजूद हो तो उनके लिए काम करना नामुमकिन था।

आलू भुन जाने पर दोनों ने गरम-गरम आलू छील-छीलकर खाना शुरू किया। कल से उनके पेट में अन्न का दाना न पड़ा था। बुधिया के कराहने की आवाज़ अब धीमी पड़ती जा रही थी, लेकिन दोनों में से किसी ने उठकर अंदर जाने का साहस न किया।`
      },
      {
        id: 'kafan-ch2',
        chapterNumber: 2,
        title: 'भाग २: कफ़न का चंदा और मधुशाला',
        wordCount: 320,
        content: `सवेरे जब माधव झोपड़े के अंदर गया, तो देखा कि बुधिया का शरीर ठंडा पड़ चुका था। उसकी आँखों पर मक्खियाँ भिनक रही थीं और उसके नन्हे बच्चे की साँसें भी टूट चुकी थीं। माधव छाती पीट-पीटकर रोने लगा।

पड़ोसियों ने रोने की आवाज़ सुनी तो दौड़े आए और दोनों को ढाढ़स बँधाने लगे। लेकिन असल समस्या यह थी कि मुर्दे के कफ़न और दाह-संस्कार के लिए फूटी कौड़ी भी न थी।

घीसू और माधव रोते हुए गाँव के ज़मींदार के पास पहुँचे। ज़मींदार साहब भले ही उनसे नफ़रत करते थे, पर दया करके उन्होंने दो रुपये फेंक दिए। इसके बाद गाँव के अन्य भले आदमियों ने भी चंदा दिया। शाम तक उनके पास पूरे पाँच रुपये जमा हो गए।

दोनों कफ़न खरीदने बाज़ार गए। दुकानदारों ने तरह-तरह के कपड़े दिखाए—रेशमी, सूती, लाल और सफ़ेद। पर घीसू को कोई कपड़ा पसंद न आया।

घीसू ने दार्शनिक भाव से कहा—कैसा अजीब दस्तूर है! जिसे जीते-जी तन ढकने को चिथड़ा भी न मिला, उसे मरने पर नया कफ़न चाहिए! कफ़न भी तो लाश के साथ जल ही जाता है।

माधव ने उसकी बात में हामी भरी। दोनों चुपचाप मधुशाला की ओर बढ़ गए। वहाँ उन्होंने भरपेट शराब ली, पूरियाँ और चटपटे कबाब खरीदे और कई दिनों की भूख मिटाई। नशे में झूमते हुए दोनों ने बुधिया की आत्मा की शांति के लिए प्रार्थना की और गीत गाने लगे। यह गरीबी की वह पराकाष्ठा थी जहाँ सामाजिक मर्यादाएँ दम तोड़ देती हैं।`
      }
    ]
  },

  // 3. PANCH PARMESHWAR - MUNSHI PREMCHAND (HINDI)
  {
    id: 'panch-parmeshwar',
    title: 'Panch Parmeshwar (पंच परमेश्वर)',
    titleHindi: 'पंच परमेश्वर',
    author: 'मुंशी प्रेमचंद (Munshi Premchand)',
    language: 'hindi',
    genre: 'Classic Hindi Stories',
    coverColor: 'linear-gradient(135deg, #059669, #10b981)',
    description: 'न्याय, मित्रता और निष्पक्ष सत्य की प्रतिष्ठा पर आधारित कालजयी रचना।',
    chapters: [
      {
        id: 'panch-ch1',
        chapterNumber: 1,
        title: 'भाग १: मित्रता और मौसी का विवाद',
        wordCount: 290,
        content: `जुम्मन शेख और अलगू चौधरी में बड़ी पुरानी और गाढ़ी मित्रता थी। दोनों में न खान-पान का साझा था और न धर्म का, केवल विचारों की समानता और विश्वास की नींव पर उनकी दोस्ती टिकी हुई थी।

जुम्मन की एक बूढ़ी खाला (मौसी) थीं, जिनके पास थोड़ी-सी मिल्कियत थी। उनके निकट संबंधियों में कोई न था। जुम्मन ने लंबे-चौड़े वादे करके वह ज़मीन अपने नाम लिखवा ली। जब तक रजिस्ट्री की मुहर न लगी थी, तब तक खालाजान की खूब खातिरदारी हुई। मीठे-मीठे हलवे और पुलाव परोसे जाते थे।

किन्तु रजिस्ट्री होते ही खातिरदारियों पर ताला लग गया। जुम्मन की पत्नी करीमन रोटियों के साथ कड़वे वचनों के तीर भी चलाने लगी। बूढ़ी मौसी रोज़ यह ज़हर का घूँट पीती रही।

अंत में जब पानी सिर से ऊपर गुज़र गया, तो मौसी ने जुम्मन से कहा—बेटा, तुम्हारे साथ मेरा निर्वाह न होगा। मुझे माहवार खर्च दे दिया करो, मैं अपना अलग पका लूँगी।

जुम्मन ने बेरुखी से जवाब दिया—रुपये क्या यहाँ फलते हैं?

खाला ने बिगड़कर कहा—तो क्या मुझे पेट की रोटी भी न मिलेगी?

जुम्मन ने गर्व से कहा—जाओ, पंचायत बुला लो, अदालत कर लो।

बूढ़ी खाला अपनी लकड़ी टेकती हुई गाँव-गाँव घूमने लगीं और पंचों से अपनी फ़रियाद करने लगीं। उन्होंने अलगू चौधरी के पास जाकर भी गुहार लगाई।`
      },
      {
        id: 'panch-ch2',
        chapterNumber: 2,
        title: 'भाग २: पंचायत का फैसला',
        wordCount: 315,
        content: `संध्या समय एक पुराने वृक्ष के नीचे पंचायत बैठी। शेख जुम्मन ने पहले से ही फ़र्श का प्रबंध कर रखा था। गाँव के सभी प्रमुख लोग उपस्थित थे।

जब पंच चुनने की बारी आई, तो बूढ़ी मौसी ने कहा—पंचों, परमात्मा की अदालत में कोई किसी का दोस्त या दुश्मन नहीं होता। मैं अलगू चौधरी को सरपंच मानती हूँ।

जुम्मन का दिल बल्लियों उछल पड़ा। उन्हें पूरा विश्वास था कि अलगू उनके मित्र हैं और फैसला उन्हीं के पक्ष में आएगा।

अलगू चौधरी ने सरपंच का आसन ग्रहण किया। उनके चेहरे पर अब मित्र का नहीं, बल्कि न्यायकर्ता का अलौकिक तेज था। उन्होंने दोनों पक्षों की बातें ध्यानपूर्वक सुनीं। जुम्मन से जिरह की गई और मौसी के अधिकारों की समीक्षा हुई।

अंत में अलगू चौधरी ने गंभीर वाणी में फैसला सुनाया—पंचों ने इस मामले पर भली-भाँति विचार किया है। हमारा निर्णय यह है कि जुम्मन मौसी को माहवार खर्च दें। यदि उन्हें यह शर्त स्वीकार न हो, तो रजिस्ट्री रद्द समझी जाए।

यह फैसला सुनते ही जुम्मन सन्न रह गए। जिस मित्र पर उन्हें सबसे अधिक भरोसा था, उसी ने उनकी जड़ काट दी थी। उसी दिन से दोनों की मित्रता की दीवार हिल गई। पर न्याय के आसन पर बैठकर अलगू ने यह सिद्ध कर दिया था कि पंच के मुँह से केवल परमेश्वर ही बोलता है।`
      }
    ]
  },

  // 4. THE ADVENTURES OF SHERLOCK HOLMES - ARTHUR CONAN DOYLE (ENGLISH)
  {
    id: 'sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Sir Arthur Conan Doyle',
    language: 'english',
    genre: 'Classic Detective Fiction',
    coverColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    description: 'The world’s most celebrated detective solving thrilling mysteries through brilliant deduction.',
    chapters: [
      {
        id: 'sherlock-ch1',
        chapterNumber: 1,
        title: 'Chapter 1: A Scandal in Bohemia',
        wordCount: 310,
        content: `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.

He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men’s motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results. Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his.

And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory. I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention. Holmes, who loathed every form of society with his whole Bohemian soul, remained in our lodgings in Baker Street, alternating from week to week between cocaine and ambition, the drowsy drug and the fierce energy of his keen nature.`
      },
      {
        id: 'sherlock-ch2',
        chapterNumber: 2,
        title: 'Chapter 2: The Red-Headed League',
        wordCount: 315,
        content: `I had called upon my friend, Mr. Sherlock Holmes, one day in the autumn of last year and found him in deep conversation with a very stout, florid-faced, elderly gentleman with fiery red hair. With an apology for my intrusion, I was about to withdraw when Holmes pulled me abruptly into the room and closed the door behind me.

“You could not have come at a better time, my dear Watson,” he said cordially.

“I was afraid that you were engaged.”

“So I am. Very much so.”

“Then I can wait in the next room.”

“Not at all. This gentleman, Mr. Wilson, has been my partner and helper in many of my most successful cases, and I have no doubt that he will be of the utmost use to me in yours also.”

The stout gentleman half rose from his chair and gave a bob of greeting, with a quick little questioning glance from his small fat-encircled eyes.

“Try the settee,” said Holmes, relapsing into his armchair and putting his fingertips together, as was his custom when in judicial moods. “I know, my dear Watson, that you share my love of all that is bizarre and outside the conventions and humdrum routine of everyday life. You have shown your relish for it by the enthusiasm which has prompted you to chronicle and, if you will excuse my saying so, to somewhat embellish so many of my little adventures.”

“Your cases have indeed been of the greatest interest to me,” I observed.

“You will remember that I remarked the other day, just before we went into the very simple problem presented by Miss Mary Sutherland, that for strange effects and extraordinary combinations we must go to life itself, which is always far more daring than any effort of the imagination.”`
      }
    ]
  },

  // 5. THE TIME MACHINE - H.G. WELLS (ENGLISH)
  {
    id: 'time-machine',
    title: 'The Time Machine',
    author: 'H.G. Wells',
    language: 'english',
    genre: 'Classic Science Fiction',
    coverColor: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    description: 'A pioneering journey across the fourth dimension into the far future of humankind.',
    chapters: [
      {
        id: 'time-machine-ch1',
        chapterNumber: 1,
        title: 'Chapter 1: The Fourth Dimension',
        wordCount: 295,
        content: `The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision.

“You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception.”

“Is not that rather a large thing to expect us to begin upon?” said Filby, an argumentative person with red hair.

“I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions.”

“That is all right,” said the Psychologist.

“Nor, having only length, breadth, and thickness, can a cube have a real existence.”

“There I object,” said Filby. “Of course a solid body may exist. All real things—”

“So most people think. But wait a moment. Can an instantaneous cube exist?”

“Don’t follow you,” said Filby.

“Can a cube that does not exist for any time at all, have any real existence?”

Filby became pensive. “Clearly,” the Time Traveller proceeded, “any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration.”`
      }
    ]
  }
];
