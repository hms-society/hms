import { faker } from '@faker-js/faker'

import {
  ContactChannel,
  type ContactChannel as ContactChannelValue,
} from '../contact-channel'

export class ContactChannelFaker {
  static fake(): ContactChannelValue {
    return faker.helpers.arrayElement(Object.values(ContactChannel))
  }
}
