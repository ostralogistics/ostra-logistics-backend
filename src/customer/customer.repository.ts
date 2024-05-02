
import { CardEntity } from "src/Entity/card.entity";
import { ComplaintEntity } from "src/Entity/complaints.entity";
import { CustomerEntity } from "src/Entity/customers.entity";
import { NewsLetterEntity } from "src/Entity/newsletter.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(CustomerEntity)
export class CustomerRepository extends Repository<CustomerEntity>{}


@EntityRepository(CardEntity)
export class CardRepository extends Repository<CardEntity>{}

@EntityRepository(NewsLetterEntity)
export class NewsLetterRepository extends Repository<NewsLetterEntity>{}


@EntityRepository(ComplaintEntity)
export class complaintRepository extends Repository<ComplaintEntity>{}