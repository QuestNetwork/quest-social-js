# Quest Social JS
> Lower level functionality for [QD Social TS](https://github.com/QuestNetwork/qd-social-ts)

## Lead Maintainer

[StationedInTheField](https://github.com/StationedInTheField)

## Description

The Social process for the [Quest Network Operating System](https://github.com/QuestNetwork/quest-os-js) orchestrates, stores and synchronizes configuration data, discovers and shares relevant information about dolphin peers. Uses [IPFS DAGs](https://docs.ipfs.io/concepts/merkle-dag/) for timelines.

See [QD Social TS](https://github.com/QuestNetwork/qd-social-ts) the [Features](https://github.com/QuestNetwork/qd-social-ts#Features) & [Roadmap](https://github.com/QuestNetwork/qd-social-ts#Roadmap)

## Installation & Usage
```
npm install @questnetwork/quest-social-js@0.9.3
```

## API

### profile

#### social.profile.togglePrivacy(profilePubKey = 'NoProfileSelected')
[![Social](https://img.shields.io/badge/process-Social-green)](https://github.com/QuestNetwork/quest-social-js) [![Bee](https://img.shields.io/badge/process-Bee-yellow)](https://github.com/QuestNetwork/quest-bee-js) [![Ocean](https://img.shields.io/badge/process-Ocean-blue)](https://github.com/QuestNetwork/quest-ocean-js)

Toggles your profile's visibility between private and public, not giving a pubKey will automatically select your first profile.
In private mode you have to manually share your profile with everyone you want to see your details. In Public mode all the members of the channels you're in can see your profile.

```javascript
<os>.social.profile.togglePrivacy();
```

#### social.profile.isPublic(socialPubKey = 'NoProfileSelected')
[![Social](https://img.shields.io/badge/process-Social-green)](https://github.com/QuestNetwork/quest-social-js) [![Bee](https://img.shields.io/badge/process-Bee-yellow)](https://github.com/QuestNetwork/quest-bee-js) [![Ocean](https://img.shields.io/badge/process-Ocean-blue)](https://github.com/QuestNetwork/quest-ocean-js)

Checks if a profile has public visibility, not giving a pubKey will automatically select your first profile.

```javascript
if(<os>.social.profile.isPublic(socialPubKey)){
  console.log("Hello Universe");
};
```

#### social.profile.isFavorite(socialPubKey)
[![Social](https://img.shields.io/badge/process-Social-green)](https://github.com/QuestNetwork/quest-social-js) [![Bee](https://img.shields.io/badge/process-Bee-yellow)](https://github.com/QuestNetwork/quest-bee-js) [![Ocean](https://img.shields.io/badge/process-Ocean-blue)](https://github.com/QuestNetwork/quest-ocean-js)

Checks if a profile is in our favorites, returns boolean true or false.

```javascript
if(<os>.social.profile.isFavorite(socialPubKey)){
  console.log("Hello Universe");
};
```

#### social.profile.isRequestedFavorite(socialPubKey)
[![Social](https://img.shields.io/badge/process-Social-green)](https://github.com/QuestNetwork/quest-social-js) [![Bee](https://img.shields.io/badge/process-Bee-yellow)](https://github.com/QuestNetwork/quest-bee-js) [![Ocean](https://img.shields.io/badge/process-Ocean-blue)](https://github.com/QuestNetwork/quest-ocean-js)

Checks if a profile is a requested favorite, returns boolean true or false.

```javascript
if(<os>.social.profile.isRequestedFavorite(socialPubKey)){
  console.log("Hello Universe");
};
```

#### social.search(searchPhrase)
[![Social](https://img.shields.io/badge/process-Social-green)](https://github.com/QuestNetwork/quest-social-js) [![Bee](https://img.shields.io/badge/process-Bee-yellow)](https://github.com/QuestNetwork/quest-bee-js)  

Will automatically search for all social profiles in the peers network where alias, full name or about text match the phrase.
This version of the methos is case sensitive by default, future versions will allow a config object.

Returns an array with the search results and adds the following fields:
```
isFavorite: boolean
isRequestedFavorite: boolean
```

```
let results = <os>.social.search('Bob');
```

## Support Us
Please consider supporting us, so that we can build a non-profit for this project (ツ)

| Ethereum| Bitcoin |
|---|---|
| `0xBC2A050E7B87610Bc29657e7e7901DdBA6f2D34E` | `bc1qujrqa3s34r5h0exgmmcuf8ejhyydm8wwja4fmq`   |
|  <img src="https://github.com/QuestNetwork/qDesk/raw/master/doc/images/eth-qr.png" >   | <img src="https://github.com/QuestNetwork/qDesk/raw/master/doc/images/btc-qr.png" > |

## License

GNU AGPLv3
