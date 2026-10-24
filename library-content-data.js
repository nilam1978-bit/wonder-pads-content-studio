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
      notes:'A single bold deep teal announcement. Keep it short.'}),
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
  const coverLabels={'wp-tpl-event-thanks':'THANK YOU'};
  additions.forEach(a=>{if(coverLabels[a.id])a.hookLabel=coverLabels[a.id];});
  window.WONDER_READY_POSTS=[...originals,...additions];
})();
