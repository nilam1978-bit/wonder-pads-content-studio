// Browser-safe library extension. Dates in the original plan are kept; new
// entries are intentionally undated so the maker chooses when to use them.
(function(){
  const sections={
    start:[6,8,42,68],
    fit:[12,14,26,30,57,114,115,132],
    care:[41,49,51,61],
    brand:[27,35,102,103,104,106,107,108,109,112,125],
    small:[73,78,88,91,93]
  };
  const originals=window.WONDER_READY_POSTS||[];
  for(const post of originals){
    post.librarySection=Object.keys(sections).find(key=>sections[key].includes(post.ideaId))||'brand';
    if(post.ideaId===51)post.archived=true;
  }
  const additions=[
  {
    "title": "Which side of a cloth pad goes against your skin?",
    "priority": 1,
    "stylePair": "informative",
    "middleStyle": "steps",
    "slides": [
      {
        "title": "Which side goes against your skin?",
        "body": "A simple guide to wearing your first cloth pad."
      },
      {
        "title": "Topper towards your body",
        "body": "The topper is the skin-facing layer. Wonder Pads offers printed cotton toppers, with organic solid cotton options."
      },
      {
        "title": "Backing towards your underwear",
        "body": "The backing faces your underwear. It is a different layer from the topper and absorbent core."
      },
      {
        "title": "Wings underneath",
        "body": "Place the pad inside your underwear. Fold the wings around the gusset and fasten the snaps underneath. Adjust it so it sits comfortably."
      },
      {
        "title": "Save your first-pad guide",
        "body": "Topper up. Wings underneath. Follow @ecoclothpad for practical tips, or message me if you need help."
      }
    ],
    "caption": "Which side of a cloth pad goes against your skin?\n\nThe topper faces your body, the backing faces your underwear, and the wings snap underneath. Wonder Pads topper choices are printed cotton, with organic solid cotton options.\n\nThere are no adhesive strips. What matters is a comfortable fit and coverage that suits you.\n\nSave this guide for your first try, and message @ecoclothpad if you need help.",
    "notes": "Use real Wonder Pads photos to show both sides and the fastened wings. Keep topper, core and backing descriptions separate.",
    "id": "wp-library-wear",
    "ideaId": 2001,
    "librarySection": "start",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "Which side of a cloth pad goes against your skin?",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "Which side of a cloth pad goes against your skin?",
    "defaultSize": "portrait",
    "script": "Slide 1: Which side goes against your skin?\nA simple guide to wearing your first cloth pad.\n\nSlide 2: Topper towards your body\nThe topper is the skin-facing layer. Wonder Pads offers printed cotton toppers, with organic solid cotton options.\n\nSlide 3: Backing towards your underwear\nThe backing faces your underwear. It is a different layer from the topper and absorbent core.\n\nSlide 4: Wings underneath\nPlace the pad inside your underwear. Fold the wings around the gusset and fasten the snaps underneath. Adjust it so it sits comfortably.\n\nSlide 5: Save your first-pad guide\nTopper up. Wings underneath. Follow @ecoclothpad for practical tips, or message me if you need help."
  },
  {
    "title": "Do I have to wash a cloth pad in a public toilet?",
    "priority": 2,
    "stylePair": "clear",
    "middleStyle": "steps",
    "slides": [
      {
        "title": "Wash my cloth pad in a public toilet?",
        "body": "No. Change it, fold it and take it home."
      },
      {
        "title": "Change into a fresh pad",
        "body": "Unfasten your used pad and replace it with a clean one. Keep the fresh spare in a separate clean pouch or compartment."
      },
      {
        "title": "Fold the used pad inward",
        "body": "Fold the soiled side inward and secure the snaps. The used pad stays separate from your clean spare."
      },
      {
        "title": "Store it for the journey home",
        "body": "Put it in a waterproof wet bag or leak-resistant pouch. Empty the bag when you get home and follow your supplied washing instructions."
      },
      {
        "title": "Change. Fold. Store. Wash later.",
        "body": "Save this for your next day out. Share it with a friend who has the same question."
      }
    ],
    "caption": "Do I have to wash a cloth pad in a public toilet?\n\nNo. Carry a clean spare in its own pouch or compartment, and a wet bag for the used pad.\n\nChange into the fresh pad, fold the used one inward and take it home in the wet bag. When you get home, empty the bag and follow your Wonder Pads care instructions.\n\nSave this for your next day out. Would you feel comfortable trying cloth pads outside?",
    "notes": "Show a clean demonstration pad and separate clean and used-pad pouches. Do not use real soiled items in the photo.",
    "id": "wp-library-outside",
    "ideaId": 2002,
    "librarySection": "start",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "Do I have to wash a cloth pad in a public toilet?",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "Do I have to wash a cloth pad in a public toilet?",
    "defaultSize": "portrait",
    "script": "Slide 1: Wash my cloth pad in a public toilet?\nNo. Change it, fold it and take it home.\n\nSlide 2: Change into a fresh pad\nUnfasten your used pad and replace it with a clean one. Keep the fresh spare in a separate clean pouch or compartment.\n\nSlide 3: Fold the used pad inward\nFold the soiled side inward and secure the snaps. The used pad stays separate from your clean spare.\n\nSlide 4: Store it for the journey home\nPut it in a waterproof wet bag or leak-resistant pouch. Empty the bag when you get home and follow your supplied washing instructions.\n\nSlide 5: Change. Fold. Store. Wash later.\nSave this for your next day out. Share it with a friend who has the same question."
  },
  {
    "title": "How do you wash cloth pads?",
    "priority": 3,
    "stylePair": "gentle",
    "middleStyle": "soft",
    "slides": [
      {
        "title": "Washing cloth pads: where do I start?",
        "body": "Rinse. Wash. Dry completely."
      },
      {
        "title": "Start with a cool rinse",
        "body": "Cool water helps with rinsing blood from the fabric. Follow the care instructions supplied with your pad."
      },
      {
        "title": "Wash thoroughly",
        "body": "Use the detergent and washing method recommended in your care instructions. Rinsing alone is not the full washing routine for a used pad."
      },
      {
        "title": "Dry completely",
        "body": "Follow your pad instructions for drying. In humid weather, allow enough time and airflow before putting clean pads away."
      },
      {
        "title": "Save your wash-day reminder",
        "body": "Rinse, wash and dry completely. Keep your Wonder Pads care instructions handy, and ask @ecoclothpad if you are unsure."
      }
    ],
    "caption": "How do you wash cloth pads?\n\nRinsing is the first step, not the whole routine. Follow the care instructions supplied with your Wonder Pads for washing and drying, and put clean pads away only once they are completely dry.\n\nA breezy drying space can be helpful in humid weather. There is no need to invent a complicated routine or use a method your care card does not recommend.\n\nSave this as a reminder and message @ecoclothpad with your care questions.",
    "notes": "Use the current Wonder Pads care card when adding demonstrations. Do not infer tumble-dryer suitability, water temperature for the main wash, bleach use or a drying-time guarantee.",
    "id": "wp-library-wash",
    "ideaId": 2003,
    "librarySection": "start",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "How do you wash cloth pads?",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "How do you wash cloth pads?",
    "defaultSize": "portrait",
    "script": "Slide 1: Washing cloth pads: where do I start?\nRinse. Wash. Dry completely.\n\nSlide 2: Start with a cool rinse\nCool water helps with rinsing blood from the fabric. Follow the care instructions supplied with your pad.\n\nSlide 3: Wash thoroughly\nUse the detergent and washing method recommended in your care instructions. Rinsing alone is not the full washing routine for a used pad.\n\nSlide 4: Dry completely\nFollow your pad instructions for drying. In humid weather, allow enough time and airflow before putting clean pads away.\n\nSlide 5: Save your wash-day reminder\nRinse, wash and dry completely. Keep your Wonder Pads care instructions handy, and ask @ecoclothpad if you are unsure."
  },
  {
    "title": "Can cloth pads leak? Here is what matters.",
    "priority": 4,
    "stylePair": "informative",
    "middleStyle": "steps",
    "slides": [
      {
        "title": "But will cloth pads leak?",
        "body": "They can. Just as disposable pads can. Here is what to check."
      },
      {
        "title": "Match absorbency to your flow",
        "body": "A light liner is not designed for a heavy-flow day. Choose absorbency suited to your flow, rather than relying on a pretty print or extra length."
      },
      {
        "title": "Check coverage and fit",
        "body": "A pad that is too short, poorly positioned or shifting may not catch your flow where you need it. Length, shape and fit matter too."
      },
      {
        "title": "Change before it is saturated",
        "body": "Every pad has a limit. Change regularly, and sooner when your flow needs it. Notice where and when a leak happens so you can adjust one thing at a time."
      },
      {
        "title": "Save your leak checklist",
        "body": "Check absorbency, coverage, fit and timing. Message @ecoclothpad for help choosing your next pad."
      }
    ],
    "caption": "Can cloth pads leak? Yes, and so can disposable pads.\n\nAbsorbency, coverage, fit and changing frequency all matter. A longer pad is not automatically a more absorbent pad, and a liner is not a heavy-flow pad.\n\nIf something leaks, notice where and when it happens. Adjusting one thing at a time can help you work out what suits you.\n\nSave this checklist, or message @ecoclothpad for help choosing.",
    "notes": "Shorter alternative to the older eight-slide leak guide. No leakproof guarantee.",
    "id": "wp-library-leaks",
    "ideaId": 2004,
    "librarySection": "care",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "Can cloth pads leak? Here is what matters.",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "Can cloth pads leak? Here is what matters.",
    "defaultSize": "portrait",
    "script": "Slide 1: But will cloth pads leak?\nThey can. Just as disposable pads can. Here is what to check.\n\nSlide 2: Match absorbency to your flow\nA light liner is not designed for a heavy-flow day. Choose absorbency suited to your flow, rather than relying on a pretty print or extra length.\n\nSlide 3: Check coverage and fit\nA pad that is too short, poorly positioned or shifting may not catch your flow where you need it. Length, shape and fit matter too.\n\nSlide 4: Change before it is saturated\nEvery pad has a limit. Change regularly, and sooner when your flow needs it. Notice where and when a leak happens so you can adjust one thing at a time.\n\nSlide 5: Save your leak checklist\nCheck absorbency, coverage, fit and timing. Message @ecoclothpad for help choosing your next pad."
  },
  {
    "title": "Why so many cloth pad shapes and sizes?",
    "priority": 5,
    "stylePair": "colourful",
    "middleStyle": "soft",
    "slides": [
      {
        "title": "Why so many shapes and sizes?",
        "body": "Because your period is not one-size-fits-all."
      },
      {
        "title": "Different days, different flows",
        "body": "Some days are light and others are heavier. Choose absorbency for what you need, rather than expecting one pad to suit every day."
      },
      {
        "title": "Different coverage needs",
        "body": "Some people prefer shorter pads. Others want more front or back coverage, especially when resting or sleeping. Length and absorbency do different jobs."
      },
      {
        "title": "Different fits and topper choices",
        "body": "Shape, wings and underwear fit all affect comfort. For the skin-facing topper, choose printed cotton or an organic solid cotton option."
      },
      {
        "title": "Find the pad that suits you",
        "body": "Save this before choosing. Explore wonder-pads.com or message @ecoclothpad about length, shape, absorbency and topper options."
      }
    ],
    "caption": "Why do Wonder Pads come in different shapes and sizes?\n\nBecause flow, coverage needs, underwear fit and personal preferences are not the same for everyone. Your needs can also change from one day of your period to the next.\n\nLength, shape and absorbency do different jobs. The topper is the layer against your skin: printed cotton, with organic solid cotton options.\n\nSave this guide and message @ecoclothpad if you would like help choosing.",
    "notes": "Photograph actual pad options. Do not imply every length, shape or topper is always in stock.",
    "id": "wp-library-sizes",
    "ideaId": 2005,
    "librarySection": "fit",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "Why so many cloth pad shapes and sizes?",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "Why so many cloth pad shapes and sizes?",
    "defaultSize": "portrait",
    "script": "Slide 1: Why so many shapes and sizes?\nBecause your period is not one-size-fits-all.\n\nSlide 2: Different days, different flows\nSome days are light and others are heavier. Choose absorbency for what you need, rather than expecting one pad to suit every day.\n\nSlide 3: Different coverage needs\nSome people prefer shorter pads. Others want more front or back coverage, especially when resting or sleeping. Length and absorbency do different jobs.\n\nSlide 4: Different fits and topper choices\nShape, wings and underwear fit all affect comfort. For the skin-facing topper, choose printed cotton or an organic solid cotton option.\n\nSlide 5: Find the pad that suits you\nSave this before choosing. Explore wonder-pads.com or message @ecoclothpad about length, shape, absorbency and topper options."
  },
  {
    "title": "It is so pretty… I cannot use it for period blood!",
    "priority": 6,
    "stylePair": "gentle",
    "middleStyle": "editorial",
    "slides": [
      {
        "title": "Too pretty to use for period blood?",
        "body": "I understand the hesitation. But the print is there to be enjoyed."
      },
      {
        "title": "Useful can be beautiful",
        "body": "I use prints because something practical can still feel personal. Period care does not have to be plain to do its job."
      },
      {
        "title": "Made to be used, not kept untouched",
        "body": "A pad is there for real life. Enjoying the print and using it for your period are not opposites. You do not have to keep it pristine to appreciate it."
      },
      {
        "title": "No stain-free promises",
        "body": "Printed cotton is not a guarantee against staining or fading. Follow your pad care instructions. If you prefer a plain topper, organic solid cotton options are available too."
      },
      {
        "title": "Pretty enough to use",
        "body": "Save this for the print you are saving for a special day. Follow @ecoclothpad for handmade pads and honest period-care conversations."
      }
    ],
    "caption": "It is so pretty… I cannot bring myself to use it for period blood!\n\nI understand. But my thinking is that something useful can also bring a little joy. The print is part of what makes your pad feel like yours, not a reason to leave it unused.\n\nI do not promise stain-free fabric or a print that never fades. Follow your supplied care instructions and choose what you enjoy using. If prints are not your preference, Wonder Pads also offers organic solid cotton topper options.\n\nIs there a print you have been saving instead of using? Tell me below.",
    "notes": "This is Wonder Pads philosophy, not a claim about all cloth-pad makers. Use a real favourite cotton print.",
    "id": "wp-library-pretty-prints",
    "ideaId": 2006,
    "librarySection": "brand",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "It is so pretty… I cannot use it for period blood!",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "It is so pretty… I cannot use it for period blood!",
    "defaultSize": "portrait",
    "script": "Slide 1: Too pretty to use for period blood?\nI understand the hesitation. But the print is there to be enjoyed.\n\nSlide 2: Useful can be beautiful\nI use prints because something practical can still feel personal. Period care does not have to be plain to do its job.\n\nSlide 3: Made to be used, not kept untouched\nA pad is there for real life. Enjoying the print and using it for your period are not opposites. You do not have to keep it pristine to appreciate it.\n\nSlide 4: No stain-free promises\nPrinted cotton is not a guarantee against staining or fading. Follow your pad care instructions. If you prefer a plain topper, organic solid cotton options are available too.\n\nSlide 5: Pretty enough to use\nSave this for the print you are saving for a special day. Follow @ecoclothpad for handmade pads and honest period-care conversations."
  },
  {
    "title": "Printed cotton against my skin: what about the dyes?",
    "priority": 7,
    "stylePair": "clear",
    "middleStyle": "steps",
    "slides": [
      {
        "title": "Printed cotton: what about the dyes?",
        "body": "Here is what I can explain without making blanket safety promises."
      },
      {
        "title": "Know which layer you are choosing",
        "body": "Wonder Pads topper choices are printed cotton, with organic solid cotton options. The topper touches your skin; it is separate from the core and backing."
      },
      {
        "title": "Know where the prints come from",
        "body": "Many of my fabrics come from brands such as Moda and Riley Blake. A brand name alone is not proof of a particular fabric certificate or pad-safety test."
      },
      {
        "title": "What I do before sewing",
        "body": "I wash every topper fabric at least once with water only, without detergent. This is a preparation step, not proof that every dye or residue is gone."
      },
      {
        "title": "Printed or organic is not the whole answer",
        "body": "Fabric processing, dyes and finishes matter too. Organic cotton alone does not mean an undyed or irritation-free finished fabric. Specific testing is more useful than blanket labels."
      },
      {
        "title": "Ask about the fabric you choose",
        "body": "Save or share this honest fabric guide. Message @ecoclothpad about a specific topper. If a pad irritates your skin, stop using it and seek medical advice."
      }
    ],
    "caption": "Printed cotton against my skin: what about the dyes?\n\nIt is a fair question. Wonder Pads offers printed cotton toppers, with organic solid cotton options. Many of my prints come from brands such as Moda and Riley Blake.\n\nI wash all topper fabrics at least once before sewing, using water only, without detergent. That is a preparation step, not a chemical safety test or a promise that all residues are removed.\n\nA brand name, a plain colour or the word organic does not establish every detail of a finished fabric. I will not describe every topper as dye-free, hypoallergenic or certified without evidence for that specific fabric.\n\nMessage @ecoclothpad if you want to discuss a particular topper. If a product irritates your skin, stop using it and seek medical advice.",
    "notes": "No universal safety, dye-free, GOTS or OEKO-TEX claim. Supplier brands are user-confirmed; US sourcing is not US manufacturing. Colour-run checks have not been confirmed. Sources: https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100 ; https://global-standards.org/our-standards/gots/how-it-works ; https://dermnetnz.org/topics/textile-dye-allergy .",
    "id": "wp-library-printed-cotton-dyes",
    "ideaId": 2007,
    "librarySection": "brand",
    "date": null,
    "week": null,
    "format": "Carousel",
    "effort": "Quick",
    "hook": "Printed cotton against my skin: what about the dyes?",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "cta": "save",
    "imageText": "Printed cotton against my skin: what about the dyes?",
    "defaultSize": "portrait",
    "script": "Slide 1: Printed cotton: what about the dyes?\nHere is what I can explain without making blanket safety promises.\n\nSlide 2: Know which layer you are choosing\nWonder Pads topper choices are printed cotton, with organic solid cotton options. The topper touches your skin; it is separate from the core and backing.\n\nSlide 3: Know where the prints come from\nMany of my fabrics come from brands such as Moda and Riley Blake. A brand name alone is not proof of a particular fabric certificate or pad-safety test.\n\nSlide 4: What I do before sewing\nI wash every topper fabric at least once with water only, without detergent. This is a preparation step, not proof that every dye or residue is gone.\n\nSlide 5: Printed or organic is not the whole answer\nFabric processing, dyes and finishes matter too. Organic cotton alone does not mean an undyed or irritation-free finished fabric. Specific testing is more useful than blanket labels.\n\nSlide 6: Ask about the fabric you choose\nSave or share this honest fabric guide. Message @ecoclothpad about a specific topper. If a pad irritates your skin, stop using it and seek medical advice."
  },
  {
    "title": "Every topper gets a water-only wash before sewing.",
    "priority": 8,
    "stylePair": "informative",
    "format": "Static post",
    "caption": "Every topper gets a water-only wash before sewing.\n\nI wash all Wonder Pads topper fabrics at least once before I sew them into pads, using water only, without detergent. This includes printed cotton and organic solid cotton topper options.\n\nThis is a preparation step. I do not describe it as sterilisation, dye testing or proof that every residue has been removed. Care for your finished pad using the instructions supplied with it.\n\nFollow @ecoclothpad for more small details from the making process.",
    "notes": "Confirmed by Nilam: all topper fabrics are washed at least once, without detergent. Do not add colour-run checks, sanitising, residue-removal claims or a guaranteed wash count beyond at least once.",
    "id": "wp-library-water-only-prewash",
    "ideaId": 2008,
    "librarySection": "brand",
    "date": null,
    "week": null,
    "effort": "Quick",
    "hook": "Every topper gets a water-only wash before sewing.",
    "hashtags": "#WonderPadsSG #ClothPadsSingapore #ReusablePads #PeriodCare #Ecoclothpad",
    "confirmation": "",
    "slides": [],
    "cta": "save",
    "imageText": "Every topper gets a water-only wash before sewing.",
    "defaultSize": "portrait",
    "script": "Image text: Every topper gets a water-only wash before sewing."
  }
];
  // ---- Fill-in templates: change the [bracketed] words, add your own photos. ----
  // Slides marked photo:true get an empty photo area. Anything in [square brackets]
  // must be replaced in "Edit words" before slides can be created.
  const TAGS='#WonderPadsSG #ClothPadsSingapore #HandmadeSG #ReusablePads';
  const tpl=(o)=>({date:null,week:null,effort:'Quick',confirmation:'',cta:'message',defaultSize:'portrait',stylePair:'gentle',middleStyle:'editorial',hashtags:TAGS,...o,hook:o.title,script:(o.slides||[]).map((x,i)=>'Slide '+(i+1)+': '+[x.title,x.body].filter(Boolean).join(' — ')).join('\n')||o.caption});
  additions.push(
    tpl({id:'wp-tpl-custom-order',ideaId:3001,librarySection:'orders',priority:9,format:'Carousel',stylePair:'order',kitId:'order',
      title:"This week's custom order: [theme or colours]",
      slides:[
        {title:'What was asked for',body:'[Size, flow, fabric or colours they wanted]',photo:true},
        {title:'How it came together',body:'[One or two sentences: fabric choice, a small detail, anything special]'},
        {title:'The finished set',body:'[One line about the finished pads]',photo:true}],
      previousCopy:{slides:[
        {title:"This week's custom order",body:'Made by hand for [first name or "a lovely customer"].'},
        {title:'What was asked for',body:'[Size, flow, fabric or colours they wanted]',photo:true},
        {title:'How it came together',body:'[One or two sentences: fabric choice, a small detail, anything special]'},
        {title:'The finished set',body:'[One line about the finished pads]',photo:true},
        {title:'Want something made just for you?',body:'Message @ecoclothpad to talk about a custom order.'}]},
      caption:"This week's custom order: [theme or colours]\n\n[Two or three sentences about who it is for, what they asked for and what you enjoyed making.]\n\nWant something made just for you? Message @ecoclothpad and we will work out the size, fabric and colours together.",
      notes:'The cover and closing slides come from the Custom order style. Add your own photos of the fabric and the finished set. Ask your customer before naming them or showing anything that identifies them.'}),
    tpl({id:'wp-tpl-new-owner',ideaId:3002,librarySection:'orders',priority:10,format:'Carousel',stylePair:'newhome',kitId:'newhome',
      title:'Off to its new home: [name of set or pad]',
      slides:[
        {title:'Packed with care',body:'[Name of set or pad], on its way to [first name].',photo:true},
        {title:'A little story',body:'[Short story: who it is for, why it was chosen, what makes it special]'},
        {title:'Ready to be loved',body:'[One line about the pad, fabric or print]',photo:true}],
      previousCopy:{slides:[
        {title:'Off to its new home',body:'[Name of set or pad] is on its way to [first name or "a new owner"].'},
        {title:'Packed with care',body:'[One line about how it was wrapped or packed]',photo:true},
        {title:'A little story',body:'[Short story: who it is for, why it was chosen, what makes it special]'},
        {title:'Ready to be loved',body:'[One line about the pad, fabric or print]',photo:true},
        {title:'Thank you, [first name]',body:'Every pad is made by hand. Thank you for choosing Wonder Pads.'}]},
      caption:"Off to its new home: [name of set or pad]\n\n[Two or three sentences about the pad and the person it is going to.]\n\nThank you, [first name], for choosing handmade. Message @ecoclothpad if you would like something made for you.",
      notes:'The cover and closing slides come from the Off to a new home style. Swap in your own photos. Ask permission before naming a customer or showing their message.'}),
    tpl({id:'wp-tpl-popup-announce',ideaId:3003,librarySection:'events',priority:11,format:'Carousel',stylePair:'popup',kitId:'popup',
      title:'Come say hello: [event name]',
      slides:[
        {title:'When and where',body:'[Event name]\nWhen: [date and time]\nWhere: [venue and address]'},
        {title:'What to expect',body:'[Two or three things: pads to see and touch, fabrics, a chat, a discount]'}],
      previousCopy:{slides:[
        {title:'Come say hello',body:'[Event name]. Wonder Pads will be there.'},
        {title:'When and where',body:'When: [date and time]\nWhere: [venue and address]'},
        {title:'What to expect',body:'[Two or three things: pads to see and touch, fabrics, a chat, a discount]'},
        {title:'See you there',body:'Questions before then? Message @ecoclothpad.'}]},
      caption:"Come say hello: [event name]\n\nWhen: [date and time]\nWhere: [venue and address]\n\n[One or two sentences on what people can expect.]\n\nQuestions before then? Message @ecoclothpad.",
      notes:'The cover and closing slides come from the Pop-up & events style. Check the date, time and address twice before posting.'}),
    tpl({id:'wp-tpl-popup-single',ideaId:3004,librarySection:'events',priority:12,format:'Static post',stylePair:'popup',
      title:'Pop-up this [day]: [event name]',
      slides:[],
      previousCopy:{stylePair:'clear'},
      caption:"Pop-up this [day]: [event name]\n\n[Date and time]\n[Venue and address]\n\n[One sentence on what you will have with you.]\n\nSee you there! Questions? Message @ecoclothpad.",
      notes:'A single bold deep sage green announcement. Keep it short.'}),
    tpl({id:'wp-tpl-event-reminder',ideaId:3005,librarySection:'events',priority:13,format:'Static post',stylePair:'popup',
      title:'Tomorrow: [event name]',
      slides:[],
      previousCopy:{stylePair:'informative'},
      caption:"Tomorrow: [event name]\n\n[Time] at [venue].\n\nCome and see the pads in person. Message @ecoclothpad with any questions.",
      notes:'Post the day before, or on the morning of the event.'}),
    tpl({id:'wp-tpl-event-thanks',ideaId:3006,librarySection:'events',priority:14,format:'Carousel',stylePair:'gentle',
      title:'Thank you for stopping by: [event name]',
      slides:[
        {title:'Thank you for stopping by',body:'[Event name] was a joy.'},
        {title:'Our table',body:'[One line about the day]',photo:true},
        {title:'What we loved',body:'[A conversation, a favourite pad, a moment that made you smile]'},
        {title:'Until next time',body:'Find us at [next event or date], or message @ecoclothpad.'}],
      caption:"Thank you for stopping by: [event name]\n\n[Two or three sentences about the day and the people you met.]\n\nFind us next at [next event or date], or message @ecoclothpad any time.",
      notes:'Add one or two of your own photos from the day.'})
  );
  // ---- From the Absorbency vs Length kit: pieces the library did not have yet ----
  additions.push(...[
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Choose two pads that really are long with lighter absorbency and shorter with heavier absorbency, so the Reel is true to what you make.",
  "slides": [],
  "librarySection": "fit",
  "defaultSize": "portrait",
  "cta": "save",
  "id": "wp-kit-which-holds-more",
  "ideaId": 4001,
  "format": "Reel",
  "title": "Which holds more, the long pad or the short one?",
  "hook": "Which holds more, the long pad or the short one?",
  "caption": "Which holds more, the long pad or the short one?\n\nIt's a trick question, because you can't tell from the length. Length is how far a pad reaches, and absorbency is how much it can hold. A long pad with light absorbency can still soak through, while a shorter pad with the right absorbency can be exactly enough.\n\nDrop 'front', 'back' or 'middle' below to tell me where your pad usually leaks, and I'll help you work out what to try.",
  "hashtags": "#WonderPadsSG #ClothPadsSingapore #LengthVsAbsorbency #ReusablePads #PeriodTalk",
  "script": "Length: 15 to 20 seconds\nScene 1\nShot: Two pads on the pink background: one long with light absorbency, one shorter with heavy absorbency.\nOn screen: Which one holds more?\nVoiceover: Which one holds more?\nScene 2\nShot: Hand taps the long pad.\nOn screen: The long one?\nVoiceover: The long one? It reaches further, but that's coverage.\nScene 3\nShot: Hand taps the shorter pad.\nOn screen: Or the short one?\nVoiceover: Or the short one? You can't tell from the length alone.\nScene 4\nShot: Both pads side by side, text appears in handwriting.\nOn screen: Length = coverage. Absorbency = holding power.\nVoiceover: Length is how far a pad reaches. Absorbency is how much it can hold.\nScene 5\nShot: You, or your handle on screen.\nOn screen: Where does yours leak?\nVoiceover: So where does yours usually leak? Tell me below and I'll help you work out what to try.",
  "notes": "Suggested for a free day in Week 4, for example Tue 3 Nov. Hold up a long, light pad and a shorter, heavy pad side by side. No liquids on camera. Call to action: tell me where your pad leaks (front, back or middle). Story prompt: share the Reel to your Story with a poll sticker, 'Which holds more? Long pad / Short pad'."
 },
 {
  "week": null,
  "date": null,
  "effort": "Quick",
  "confirmation": "",
  "slides": [],
  "librarySection": "fit",
  "defaultSize": "portrait",
  "cta": "save",
  "id": "wp-kit-length-absorbency-line",
  "ideaId": 4002,
  "format": "Static post",
  "stylePair": "gentle",
  "layout": "bigtext",
  "includeFullText": false,
  "title": "Length is how far a pad reaches. Absorbency is how much it can hold.",
  "hook": "Length is how far a pad reaches. Absorbency is how much it can hold.",
  "imageText": "Length is how far a pad reaches. / Absorbency is how much it can hold.",
  "caption": "Length is how far a pad reaches. Absorbency is how much it can hold.\n\nIt sounds simple, but it's the mix-up behind so many leaks. A long pad with light absorbency can still soak through, and a shorter pad with the right absorbency can be exactly enough.\n\nWhen you choose, ask two things: how much coverage do I need, and how much does it have to hold? Save this for your next order, and message me if you'd like help choosing.",
  "hashtags": "#WonderPadsSG #ClothPadsSingapore #LengthVsAbsorbency #ReusablePads #PeriodTips",
  "script": "Image text: Length is how far a pad reaches. Absorbency is how much it can hold.",
  "notes": "Suggested for Thu 29 Oct. Brand pink background with the two lines in Kalam handwriting, and one small pad photo in a corner. Call to action: save this for your next order. Story prompt: add the image to your Story with a quiz sticker, 'Does a longer pad always hold more? Yes / No'. No video version: a single image works best on Instagram and Facebook."
 },
 {
  "week": null,
  "date": null,
  "effort": "Quick",
  "confirmation": "The caption promises to help people who comment. Only post it if you can reply, or soften it to 'tell me below'.",
  "slides": [],
  "librarySection": "fit",
  "defaultSize": "portrait",
  "cta": "message",
  "id": "wp-kit-where-does-it-leak",
  "ideaId": 4003,
  "format": "Static post",
  "stylePair": "clear",
  "layout": "bigtext",
  "includeFullText": false,
  "title": "Where does your pad usually leak? The answer tells you what to change.",
  "hook": "Where does your pad usually leak? The answer tells you what to change.",
  "imageText": "Where does your pad leak? / Front or back: think length. / Through the middle: think absorbency. / Sides: think shape and fit.",
  "caption": "Where does your pad usually leak? The answer tells you what to change.\n\nOut the front or back usually points to length, because the pad isn't reaching far enough. Soaking through the middle usually points to absorbency, because the pad is full. Out the sides usually points to shape or fit, because the pad is shifting.\n\nIt's a rule of thumb, not a diagnosis, but it's a good place to start. If your bleeding has suddenly become much heavier than usual, it's worth checking in with a doctor as well.\n\nDrop 'front', 'back' or 'middle' below and I'll help you work out what to try.",
  "hashtags": "#WonderPadsSG #ClothPadsSingapore #PadLeaks #ReusablePads #PeriodTips",
  "script": "Image text: Where does your pad leak? Front or back: think length. Through the middle: think absorbency. Sides: think shape and fit.",
  "notes": "Suggested for Sat 7 Nov, two days before the leaks carousel. A simple pad outline on the pink background with three labels: front or back, middle, sides. Call to action: drop 'front', 'back' or 'middle' in the comments. Story prompt: add the image to your Story with a question sticker, 'Where does your pad usually leak?'. Keep the doctor note in the caption."
 }
]);
  // ---- Question poster set: one question per poster, alternating pink and fabric-photo backgrounds ----
  additions.push(...[
 {
  "id": "wp-poster-1",
  "ideaId": 5001,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "Since when did \"just put up with it\" become part of period care?",
  "title": "Since when did \"just put up with it\" become part of period care?",
  "caption": "Since when did \"just put up with it\" become part of period care?\n\nSomewhere along the way we all learned to grit our teeth through the week and call it normal. It was not normal for me, and it does not have to be for you. Cloth pads are not a magic fix for everything, but being able to choose a soft fabric you actually like makes a real difference. What is the one thing about your period you have just been putting up with?",
  "hashtags": "#ReusablePads #ClothPadsSG #WonderPadsSG #PeriodCareSG #PeriodComfort",
  "notes": "Question poster 1 of 8 (Comfort). Background: soft pink #F1CFEA. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "pink",
  "includeFullText": false,
  "imageText": "Since when did \"just put up with it\" become part of period care? / Soft cloth, made for the days you need it most.",
  "script": "Image text: Since when did \"just put up with it\" become part of period care? Soft cloth, made for the days you need it most."
 },
 {
  "id": "wp-poster-2",
  "ideaId": 5002,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "Why let your pad be the most irritating part of your period?",
  "title": "Why let your pad be the most irritating part of your period?",
  "caption": "Why let your pad be the most irritating part of your period?\n\nI got tired of dreading what I had to wear, so I started sewing my own. Now I make pads from fabrics I can feel and see before they ever reach you, and that choice changed how I get through the week. If your skin has ever told you something is not working, you are not being fussy, you are paying attention. Message me on WhatsApp and we will find a fabric that suits you.",
  "hashtags": "#ClothPadsSG #ReusablePads #WonderPadsSG #SensitiveSkin #PeriodCareSG",
  "notes": "Question poster 2 of 8 (Comfort). Background: fabric photo. Put a photo of the fabric behind the text; the soft panel keeps the words readable. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "photo",
  "includeFullText": false,
  "imageText": "Why let your pad be the most irritating part of your period? / Wonder Pads are sewn from fabrics you can see and touch before you order.",
  "script": "Image text: Why let your pad be the most irritating part of your period? Wonder Pads are sewn from fabrics you can see and touch before you order."
 },
 {
  "id": "wp-poster-3",
  "ideaId": 5003,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "If you can choose your outfit, why not your pad?",
  "title": "If you can choose your outfit, why not your pad?",
  "caption": "If you can choose your outfit, why not your pad?\n\nYou pick your shoes, your bag, even the colour of your phone case. Then every month you reach for the same plain white pad because that is all there was. Wonder Pads let you choose the fabric, the size and the wing style, so what you wear on your hardest days feels like it belongs to you. Which print would you pick first?",
  "hashtags": "#ReusablePads #ClothPadsSG #WonderPadsSG #CustomPads #PeriodCareSG",
  "notes": "Question poster 3 of 8 (Personal choice). Background: soft pink #F1CFEA. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "pink",
  "includeFullText": false,
  "imageText": "If you can choose your outfit, why not your pad? / Pick your fabric, size and wing style.",
  "script": "Image text: If you can choose your outfit, why not your pad? Pick your fabric, size and wing style."
 },
 {
  "id": "wp-poster-4",
  "ideaId": 5004,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "What if your pads were as unique as you are?",
  "title": "What if your pads were as unique as you are?",
  "caption": "What if your pads were as unique as you are?\n\nEvery pad I make is cut and sewn by hand in my home in Singapore, which means no two sets are quite the same. I love hearing which fabrics people gravitate towards, because it always says something about them. Drop your favourite colour below and I will tell you what I would make for you.",
  "hashtags": "#HandmadeSG #ClothPadsSG #WonderPadsSG #ReusablePads #SupportSmallSG",
  "notes": "Question poster 4 of 8 (Personal choice). Background: fabric photo. Put a photo of the fabric behind the text; the soft panel keeps the words readable. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "photo",
  "includeFullText": false,
  "imageText": "What if your pads were as unique as you are? / Every Wonder Pad is made by hand, one at a time.",
  "script": "Image text: What if your pads were as unique as you are? Every Wonder Pad is made by hand, one at a time."
 },
 {
  "id": "wp-poster-5",
  "ideaId": 5005,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "What happens to your pad after you throw it away?",
  "title": "What happens to your pad after you throw it away?",
  "caption": "What happens to your pad after you throw it away?\n\nMost of us never think about it, because it is out of sight the moment the bin lid closes. I started thinking about it after years of using cloth myself, and it changed how I looked at every disposable in my bathroom. A washable pad will not fix everything, but it is one small thing you can stop throwing out. Would you ever try swapping even a few pads a month?",
  "hashtags": "#ReusablePads #SustainableSG #WonderPadsSG #ClothPadsSG #ZeroWasteSG",
  "notes": "Question poster 5 of 8 (Planet). Background: soft pink #F1CFEA. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "pink",
  "includeFullText": false,
  "imageText": "What happens to your pad after you throw it away? / A washable pad is one small thing you can stop throwing out.",
  "script": "Image text: What happens to your pad after you throw it away? A washable pad is one small thing you can stop throwing out."
 },
 {
  "id": "wp-poster-6",
  "ideaId": 5006,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "Isn't it time period care looked after the planet too?",
  "title": "Isn't it time period care looked after the planet too?",
  "caption": "Isn't it time period care looked after the planet too?\n\nWe have reusable bags, bottles and straws, and period care is slowly joining the list. It does not have to be all or nothing, you can start with a small set and see how it feels. If you are curious but unsure where to begin, send me a message and I will walk you through it in plain, simple steps.",
  "hashtags": "#SustainableSG #ReusablePads #WonderPadsSG #ClothPadsSG #GreenLivingSG",
  "notes": "Question poster 6 of 8 (Planet). Background: fabric photo. Put a photo of the fabric behind the text; the soft panel keeps the words readable. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "photo",
  "includeFullText": false,
  "imageText": "Isn't it time period care looked after the planet too? / Wash it, dry it, use it again.",
  "script": "Image text: Isn't it time period care looked after the planet too? Wash it, dry it, use it again."
 },
 {
  "id": "wp-poster-7",
  "ideaId": 5007,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "How much do you spend on pads in a year?",
  "title": "How much do you spend on pads in a year?",
  "caption": "How much do you spend on pads in a year?\n\nWork it out for yourself, then ask how many years one set of cloth pads can keep going. I am not here to tell you what to spend, only to say the maths is worth doing at least once. Have you ever sat down and added it up?",
  "hashtags": "#ClothPadsSG #ReusablePads #WonderPadsSG #SaveMoneySG #PeriodCareSG",
  "notes": "Question poster 7 of 8 (Value). Background: soft pink #F1CFEA. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "pink",
  "includeFullText": false,
  "imageText": "How much do you spend on pads in a year? / Now ask how many years one set can keep going.",
  "script": "Image text: How much do you spend on pads in a year? Now ask how many years one set can keep going."
 },
 {
  "id": "wp-poster-8",
  "ideaId": 5008,
  "week": null,
  "date": null,
  "format": "Static post",
  "effort": "Quick",
  "hook": "Who decided what \"normal\" period care looks like?",
  "title": "Who decided what \"normal\" period care looks like?",
  "caption": "Who decided what \"normal\" period care looks like?\n\nI used to think plain, disposable and out of sight was simply how it was done. Ten years of using cloth pads taught me that normal is just whatever we got used to. You get to decide what feels right for your body, and I am always happy to answer questions with no pressure to buy. What did you think period care had to look like?",
  "hashtags": "#PeriodPositive #ReusablePads #WonderPadsSG #ClothPadsSG #PeriodCareSG",
  "notes": "Question poster 8 of 8 (Reflection). Background: fabric photo. Put a photo of the fabric behind the text; the soft panel keeps the words readable. Needs your WhatsApp number under My Brand → Phone to show it in the footer.",
  "confirmation": "",
  "slides": [],
  "librarySection": "posters",
  "defaultSize": "portrait",
  "cta": "message",
  "layout": "poster",
  "posterBg": "photo",
  "includeFullText": false,
  "imageText": "Who decided what \"normal\" period care looks like? / You get to decide what's normal for you.",
  "script": "Image text: Who decided what \"normal\" period care looks like? You get to decide what's normal for you."
 }
]);
  // ---- Schools pack, interview answers and story series ----
  additions.push(...[
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check you are happy naming Temasek Poly, and that this is only what you saw at the pop-up. MOE says P5 students learn about menstruation in sex education; whether lessons mention reusable products is not something you have confirmed.",
  "slides": [],
  "defaultSize": "portrait",
  "cta": "share",
  "stylePair": "gentle",
  "middleStyle": "editorial",
  "id": "wp-school-reel",
  "ideaId": 6001,
  "format": "Reel",
  "librarySection": "brand",
  "title": "None of the girls I met had heard reusable pads exist",
  "hook": "I spent two days at a pop-up at Temasek Poly, and something really stuck with me.",
  "caption": "Two days at a Temasek Poly pop-up showed me something I can't stop thinking about: none of the girls I met had heard that reusable pads exist. Nobody is saying every girl has to switch. But a choice is only a choice when you know what's on the table. If you agree, share this with someone who should hear it.",
  "hashtags": "#WonderPadsSG #PeriodEducation #InformedChoice #ReusablePadsSG #ClothPadsSG",
  "script": "Length: 40 to 50 seconds\nScene 1\nShot: You, talking to camera, warm and unhurried.\nVoiceover: I spent two days at a pop-up at Temasek Poly, and something really stuck with me.\nScene 2\nShot: You, to camera, with your pop-up table or pads behind you if you have a photo.\nVoiceover: So many young girls came up to my table, curious, picking things up, asking questions. And again and again I heard the same thing: wait, this is a thing? I didn't know this existed.\nScene 3\nShot: You, to camera.\nVoiceover: And that's the gap I keep thinking about. In P5 and P6, girls get their sex education, and they learn about periods. But none of the girls I met had ever heard that alternatives to disposable pads exist. Reusable cloth pads, menstrual cups, any of it.\nScene 4\nShot: You, to camera.\nVoiceover: I'm not saying every girl should switch. Using them or not is completely your choice. But how do you make an informed choice if you don't even know your options?\nScene 5\nShot: You, to camera, then hold on a calm close.\nOn screen: Informed choice starts with knowing the options.\nVoiceover: My suggestion is a small one: let's tell them it exists. That's it.",
  "notes": "Say 'none of the girls I met', which describes what you saw at the pop-up, not what every school teaches. Photos: do not show identifiable students, and be happy to name Temasek Poly. Recommended first post of the three; the carousel follows a few days later. More angles from this idea (hooks): 'A girl picked up a cloth pad at my table and asked, wait, this exists?' (use only if it is what really happened). 'The fix is one extra line in a lesson that already exists.' 'I am not telling anyone what to use. I am saying everyone should get to know what exists.' 'Why I wish someone had told me this at 11, not 30-something' (change the age to your own). 'Why I leave my laptop at home and set up a table instead.'"
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check you are happy naming Temasek Poly, and that slide 4 only describes the girls you met.",
  "slides": [
   {
    "title": "They learn about periods in school. They don't learn this.",
    "body": "A small idea for P5 and P6 sex education."
   },
   {
    "title": "I spent two days at a Temasek Poly pop-up.",
    "body": "Two days, one table, a lot of questions.",
    "photo": true
   },
   {
    "title": "So many young girls asked: wait, this exists?",
    "body": "Curious, picking things up, asking questions."
   },
   {
    "title": "In P5 and P6, sex ed explains periods.",
    "body": "None of the girls I met had heard of reusable options."
   },
   {
    "title": "My suggestion is small.",
    "body": "One line about reusable alternatives in P5 and P6 sex ed."
   },
   {
    "title": "Using them or not is an individual choice.",
    "body": "Knowing they exist is what makes it an informed one."
   },
   {
    "title": "Agree?",
    "body": "Share this, and tell me what you wish you had been taught."
   }
  ],
  "defaultSize": "portrait",
  "cta": "share",
  "stylePair": "clear",
  "middleStyle": "editorial",
  "id": "wp-school-carousel",
  "ideaId": 6002,
  "format": "Carousel",
  "librarySection": "brand",
  "title": "They learn about periods in school. They don't learn this.",
  "caption": "After two days at a Temasek Poly pop-up, one thing stood out: none of the girls I met had heard that reusable pads exist. My suggestion is small. When P5 and P6 sex ed covers periods, it could mention that alternatives are out there too. Use them or don't, that is entirely your call, but you should know the choice exists. What do you wish someone had told you earlier? Tell me below.",
  "hashtags": "#WonderPadsSG #PeriodEducation #InformedChoice #ClothPadsSG #ReusableSG",
  "notes": "Post a few days after the Reel. Slide 2 takes your own pop-up photo, with no identifiable students. Say 'none of the girls I met', which describes what you saw at the pop-up, not what every school teaches. Photos: do not show identifiable students, and be happy to name Temasek Poly. More angles from this idea (hooks): 'A girl picked up a cloth pad at my table and asked, wait, this exists?' (use only if it is what really happened). 'The fix is one extra line in a lesson that already exists.' 'I am not telling anyone what to use. I am saying everyone should get to know what exists.' 'Why I wish someone had told me this at 11, not 30-something' (change the age to your own). 'Why I leave my laptop at home and set up a table instead.'"
 },
 {
  "week": null,
  "date": null,
  "effort": "Quick",
  "confirmation": "",
  "slides": [],
  "defaultSize": "portrait",
  "cta": "share",
  "stylePair": "gentle",
  "middleStyle": "editorial",
  "id": "wp-school-caption",
  "ideaId": 6003,
  "format": "Static post",
  "librarySection": "brand",
  "includeFullText": false,
  "imageText": "",
  "title": "A quieter version: one photo and your own words",
  "hook": "After two days at a pop-up at Temasek Poly, I realised something.",
  "caption": "After two days at a pop-up at Temasek Poly, I realised something. None of the girls I met had known that reusable alternatives to disposable pads even exist. My suggestion is a simple one: when P5 and P6 sex education talks about periods, it could mention that these options are out there too. A washable pad is also one small thing you can stop throwing out. Whether to use them is an individual choice. But being aware of them helps girls make informed choices. That's all.",
  "hashtags": "#WonderPadsSG #PeriodEducation #InformedChoice #ReusablePadsSG #SustainablePeriods",
  "script": "Photo post: your pop-up table or a flat lay of your pads.",
  "notes": "The design starts as a blank canvas for your photo. Use it on a quieter day, when you have a good pop-up photo with no identifiable students. Say 'none of the girls I met', which describes what you saw at the pop-up, not what every school teaches. Photos: do not show identifiable students, and be happy to name Temasek Poly. "
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check the details match how you tell it: the rashes, the old cotton frocks and towels, and about ten years of using cloth.",
  "slides": [
   {
    "title": "Why I started making cloth pads",
    "body": "It began with my own skin."
   },
   {
    "title": "The pads I wore kept leaving me with rashes.",
    "body": "After a while I got tired of treating that as part of having a period."
   },
   {
    "title": "I wanted to know what I was wearing.",
    "body": "I did not like how little I could find out about what was in the pads I was using."
   },
   {
    "title": "So I sewed my own.",
    "body": "I cut up old cotton frocks and towels and made my first pads by hand."
   },
   {
    "title": "Ten years on, it is still my work.",
    "body": "I have used cloth pads for about ten years, and every Wonder Pad still goes through my hands."
   },
   {
    "title": "Curious where to start?",
    "body": "Message @ecoclothpad and we will find a fabric that suits you."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "gentle",
  "middleStyle": "editorial",
  "id": "wp-story-origin",
  "ideaId": 6004,
  "format": "Carousel",
  "librarySection": "brand",
  "title": "Why I started making cloth pads",
  "caption": "It began with my own skin. The disposable pads I wore kept leaving me with rashes, and I got tired of treating that as part of having a period. I did not like how little I could find out about what was in them either, so I cut up old cotton frocks and towels and sewed my own.\n\nThose first pads were simple, but they were soft and they were mine. About ten years on, every Wonder Pad I make still goes through my hands. If you are curious where to start, message me and we will find a fabric that suits you.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #HandmadeSG #ReusablePadsSG #MyStory",
  "notes": "Your own story. It talks about your skin, as your experience, and does not say disposable pads are unsafe."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "",
  "slides": [
   {
    "title": "It is not just a new pad.",
    "body": "It changes how you think about period care."
   },
   {
    "title": "Disposable teaches us to hide it.",
    "body": "A period becomes something to throw away as quickly as possible."
   },
   {
    "title": "Cloth is something you look after.",
    "body": "You rinse it, wash it and use it again, and that small routine can make the week feel less like something to get through."
   },
   {
    "title": "You do not have to do it all at once.",
    "body": "Try one cloth pad on a day you are at home."
   },
   {
    "title": "All of it counts.",
    "body": "Some people use cloth at home, some only overnight, and some move over completely."
   },
   {
    "title": "Want help choosing your first one?",
    "body": "Message @ecoclothpad and we will work it out together."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "gentle",
  "middleStyle": "editorial",
  "id": "wp-story-mindset",
  "ideaId": 6005,
  "format": "Carousel",
  "librarySection": "start",
  "title": "Switching to cloth is more than switching a product",
  "caption": "Moving to cloth is not only a swap of one item for another. It changes how you think about period care. Disposable pads teach us that a period is something to hide and throw away as quickly as possible. A cloth pad is something you look after, and that small routine can make the whole week feel a little less like something to get through.\n\nIt does not have to happen overnight, or all at once. Start with one cloth pad on a day you are at home and see how it feels. Want help choosing your first one? Message me.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #ReusablePadsSG #PeriodCareSG #SmallSwitches",
  "notes": "No guilt and no all-or-nothing. It echoes your idea that switching is changing a mindset, not just a product."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check these are figures you stand behind: five years or more, twelve to fifteen washes a year, and customers still using pads after ten years.",
  "slides": [
   {
    "title": "How long does a cloth pad last?",
    "body": "An honest answer from the person who sews them."
   },
   {
    "title": "With care, five years or more.",
    "body": "That is my own experience of using and making them."
   },
   {
    "title": "About once a cycle.",
    "body": "Wear one pad about once a cycle and that is roughly twelve to fifteen washes a year."
   },
   {
    "title": "Some are still going after ten years.",
    "body": "A few of my customers still use theirs after ten years."
   },
   {
    "title": "Care makes the difference.",
    "body": "Follow the care instructions and let every pad dry completely between uses."
   },
   {
    "title": "Two or three types spread the wear.",
    "body": "Many people keep a small mix and choose by the day. Message @ecoclothpad to build yours."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "informative",
  "middleStyle": "editorial",
  "id": "wp-story-lasts",
  "ideaId": 6006,
  "format": "Carousel",
  "librarySection": "care",
  "title": "How long does a cloth pad last?",
  "caption": "With proper care, a cloth pad can last five years or more. Wear a particular pad about once a cycle and that comes to roughly twelve to fifteen washes a year, which is exactly the kind of use the fabric is built for. A few of my customers are still using their pads after ten years.\n\nHow long yours lasts depends on how often you wear it and how you look after it, so follow the care instructions and let every pad dry completely between uses. Many people keep two or three types and choose by the day, which spreads the wear too.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #ReusablePadsSG #PeriodCareSG #CareTips",
  "notes": "Uses your own figures from the interview."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check the $100 to $150 starter set matches your price page today.",
  "slides": [
   {
    "title": "Aren't cloth pads expensive?",
    "body": "An honest answer."
   },
   {
    "title": "The first purchase costs more.",
    "body": "A starter set often comes to between $100 and $150."
   },
   {
    "title": "Periods are a basic need, not a luxury.",
    "body": "Disposables are a cost you pay again and again."
   },
   {
    "title": "Do your own sums.",
    "body": "What do you spend on pads in a year? Then ask how many years a set of cloth pads can keep going."
   },
   {
    "title": "You do not need a big set.",
    "body": "Start with one or two and add more as you learn what suits you."
   },
   {
    "title": "Want help choosing a small first set?",
    "body": "Message @ecoclothpad and we will work it out together."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "informative",
  "middleStyle": "editorial",
  "id": "wp-story-cost",
  "ideaId": 6007,
  "format": "Carousel",
  "librarySection": "small",
  "title": "Aren't cloth pads expensive?",
  "caption": "The honest answer is that the first purchase costs more than a pack of disposables. A starter set often comes to somewhere between $100 and $150, and I understand that can feel like a lot at once. But menstruation is a basic need, not a luxury, and the disposables are a cost you pay again and again.\n\nThe kindest thing I can suggest is to do your own sums. Work out what you spend in a year, then ask how many years a set of cloth pads can keep going. You do not need a big set to find out. Start with one or two, and message me if you would like help choosing.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #ReusablePadsSG #SaveMoneySG #PeriodCareSG",
  "notes": "Asks the reader to do the sums themselves, in the same spirit as the value poster."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "",
  "slides": [
   {
    "title": "Are cloth pads better for my skin?",
    "body": "What I can say, and what I can't."
   },
   {
    "title": "My own skin was happier.",
    "body": "Many of the women I make pads for tell me the same."
   },
   {
    "title": "I am not a doctor.",
    "body": "I will not tell you disposable pads are unsafe. Everyone's skin is different."
   },
   {
    "title": "What I can stand behind.",
    "body": "You can see and touch the fabrics before you order, and choose printed cotton or organic solid cotton."
   },
   {
    "title": "Prepared before it is sewn.",
    "body": "Every topper fabric is washed at least once, with water only, before it becomes a pad. That is a preparation step, not a safety test."
   },
   {
    "title": "Is your skin telling you something?",
    "body": "You are not being fussy. Message @ecoclothpad, and if a reaction worries you, please check in with a doctor."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "gentle",
  "middleStyle": "editorial",
  "id": "wp-story-skin",
  "ideaId": 6008,
  "format": "Carousel",
  "librarySection": "care",
  "title": "Are cloth pads better for my skin?",
  "caption": "I can only tell you what I know. My own skin was happier once I moved to cloth, and many of the women I make pads for tell me the same. But I am not a doctor, and I will not tell you disposable pads are unsafe, because that is not something I can promise either way.\n\nWhat I can stand behind is what I control. You can see and touch the fabrics before you order, and every topper fabric is washed at least once, with water only, before I sew it into a pad. If your skin has ever told you something is not working, you are not being fussy, you are paying attention. Message me and we will find a fabric that suits you.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #ReusablePadsSG #SensitiveSkin #PeriodCareSG",
  "notes": "Keep the doctor note in. It makes no claim about disposable pads."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "",
  "slides": [
   {
    "title": "No two periods are the same.",
    "body": "Do you and your best friend experience them the same way?"
   },
   {
    "title": "Same flow? Same cramps?",
    "body": "Same everything? Didn't think so."
   },
   {
    "title": "So why are we all using the same pad?",
    "body": "One shape, one size and one absorbency for everyone."
   },
   {
    "title": "At Wonder Pads, I make your pad.",
    "body": "Your size. Your absorbency. Your fabric. Built around what your body needs."
   },
   {
    "title": "One size has never fit all.",
    "body": "Not in life. Not in periods."
   },
   {
    "title": "Tell me what you need.",
    "body": "Message @ecoclothpad and we will figure it out together."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "clear",
  "middleStyle": "editorial",
  "id": "wp-story-nolike",
  "ideaId": 6009,
  "format": "Carousel",
  "librarySection": "fit",
  "title": "No two periods are the same",
  "caption": "Do you and your best friend experience your periods the exact same way? Same flow, same cramps, same everything? Didn't think so. So why are we all using the same pad?\n\nAt Wonder Pads I make your pad, built around your size, your absorbency and your fabric, because one size has never fit all. Message me and tell me what you need, and we will figure it out together.",
  "hashtags": "#WonderPadsSG #ClothPadsSG #ReusablePadsSG #PeriodCareSG #MadeForYou",
  "notes": "Written from your first story series. It reads best as a 6-frame carousel; the library cannot store Story-size frames."
 },
 {
  "week": null,
  "date": null,
  "effort": "Medium",
  "confirmation": "Check 'a good deal of plastic' and 'for years' are things you can stand behind. Add any figures only with a source.",
  "slides": [
   {
    "title": "Where does your pad go after three hours?",
    "body": "Out of sight, out of mind."
   },
   {
    "title": "In the bin, and then?",
    "body": "Most of us never think about it, because it is out of sight the moment the lid closes."
   },
   {
    "title": "Most disposable pads contain a good deal of plastic.",
    "body": "They are used once, and they do not simply disappear."
   },
   {
    "title": "A cloth pad you look after can be used again.",
    "body": "Washed and cared for, one pad can go on for years."
   },
   {
    "title": "You do not have to be perfect.",
    "body": "Even swapping a few pads a month is a real start."
   },
   {
    "title": "Ready to try a few?",
    "body": "Message @ecoclothpad and I will walk you through it in plain, simple steps."
   }
  ],
  "defaultSize": "portrait",
  "cta": "message",
  "stylePair": "clear",
  "middleStyle": "editorial",
  "id": "wp-story-planet",
  "ideaId": 6010,
  "format": "Carousel",
  "librarySection": "small",
  "title": "Where does your pad go after three hours?",
  "caption": "Where does your pad go after three hours? Most of us never think about it, because it is out of sight the moment the bin lid closes. Most disposable pads contain a good deal of plastic, and they are made to be used once.\n\nI am not asking anyone to be perfect. A washable pad is one small thing you can stop throwing out, and swapping even a few pads a month is a real start. Message me if you would like me to walk you through it.",
  "hashtags": "#WonderPadsSG #SustainableSG #ReusablePadsSG #ClothPadsSG #ZeroWasteSG",
  "notes": "A cleaned version of your second story series. The plastic percentage, the breakdown time and the ingredient lines are left out because they need a source."
 }
]);
  const coverLabels={'wp-tpl-event-thanks':'THANK YOU'};
  additions.forEach(a=>{if(coverLabels[a.id])a.hookLabel=coverLabels[a.id];});
  window.WONDER_READY_POSTS=[...originals,...additions];
})();
